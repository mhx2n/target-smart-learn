import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { messages, questionContext } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // System prompt for the question helper
    const systemPrompt = `আপনি একজন বাংলা শিক্ষা সহায়ক। আপনার কাজ হলো শিক্ষার্থীদের পরীক্ষার প্রশ্ন নিয়ে সাহায্য করা।

প্রশ্নের প্রসঙ্গ:
- প্রশ্ন: ${questionContext?.questionText || 'N/A'}
- সঠিক উত্তর: ${questionContext?.correctAnswer || 'N/A'}  
- শিক্ষার্থীর উত্তর: ${questionContext?.userAnswer || 'N/A'}
- ব্যাখ্যা: ${questionContext?.explanation || 'কোন ব্যাখ্যা নেই'}

আপনার দায়িত্ব:
- বাংলায় সহায়তা প্রদান করুন
- প্রশ্ন সম্পর্কে বিস্তারিত ব্যাখ্যা দিন
- কেন সঠিক উত্তরটি সঠিক তা ব্যাখ্যা করুন
- শিক্ষার্থীর ভুল উত্তর কেন ভুল তা বুঝিয়ে বলুন
- অতিরিক্ত টিপস ও তথ্য প্রদান করুন যা মনে রাখতে সাহায্য করবে
- সহজ ও বন্ধুত্বপূর্ণ ভাষা ব্যবহার করুন`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "অনুরোধ সীমা অতিক্রম হয়েছে, পরে আবার চেষ্টা করুন।" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "পেমেন্ট প্রয়োজন, Lovable AI ওয়ার্কস্পেসে ফান্ড যোগ করুন।" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI গেটওয়ে ত্রুটি" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Question helper error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "অজানা ত্রুটি" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
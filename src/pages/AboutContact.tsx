import { Mail, Phone, MapPin } from "lucide-react";

const AboutContact = () => (
  <div className="pt-24 pb-8 container max-w-2xl min-h-screen">
    <h1 className="text-2xl font-bold mb-6">📖 আমাদের সম্পর্কে</h1>

    <div className="glass-card-static p-6 mb-6">
      <h2 className="text-lg font-semibold mb-3">Target 🎯 কী?</h2>
      <p className="text-sm text-muted-foreground leading-relaxed">
        Target 🎯 একটি আধুনিক শিক্ষামূলক পরীক্ষা অনুশীলন প্ল্যাটফর্ম। এখানে শিক্ষার্থীরা বিভিন্ন বিষয়ের MCQ পরীক্ষায় সীমাহীনভাবে অংশগ্রহণ করতে পারবেন।
        প্রতিটি পরীক্ষায় প্রশ্ন ও অপশন এলোমেলোভাবে সাজানো হয়, যা প্রকৃত পরীক্ষার অভিজ্ঞতা প্রদান করে।
      </p>
    </div>

    <div className="glass-card-static p-6 mb-6">
      <h2 className="text-lg font-semibold mb-3">বৈশিষ্ট্যসমূহ</h2>
      <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
        <li>সীমাহীন পরীক্ষা অনুশীলন</li>
        <li>স্বয়ংক্রিয় প্রশ্ন ও অপশন র‍্যান্ডমাইজেশন</li>
        <li>বিস্তারিত ফলাফল ও ব্যাখ্যা</li>
        <li>বিষয়ভিত্তিক পরীক্ষা ব্রাউজিং</li>
        <li>মোবাইল ফ্রেন্ডলি ডিজাইন</li>
      </ul>
    </div>

    <div className="glass-card-static p-6">
      <h2 className="text-lg font-semibold mb-3">যোগাযোগ</h2>
      <div className="space-y-3 text-sm text-muted-foreground">
        <p className="flex items-center gap-2"><Mail size={16} className="text-primary" /> support@target-exam.com</p>
        <p className="flex items-center gap-2"><Phone size={16} className="text-primary" /> +880 1700 000000</p>
        <p className="flex items-center gap-2"><MapPin size={16} className="text-primary" /> ঢাকা, বাংলাদেশ</p>
      </div>
    </div>
  </div>
);

export default AboutContact;

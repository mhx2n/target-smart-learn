import { Outlet } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ReminderWidget from "@/components/ReminderWidget";
import EventBannerDisplay from "@/components/EventBannerDisplay";

const PublicLayout = () => (
  <>
    <Navbar />
    <EventBannerDisplay />
    <Outlet />
    <ReminderWidget />
    <Footer />
  </>
);

export default PublicLayout;

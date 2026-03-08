import { Outlet } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ReminderWidget from "@/components/ReminderWidget";

const PublicLayout = () => (
  <>
    <Navbar />
    <Outlet />
    <ReminderWidget />
    <Footer />
  </>
);

export default PublicLayout;

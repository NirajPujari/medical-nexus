"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { LayoutGrid, List } from "lucide-react";
import Image from "next/image";
import { useUser } from "@clerk/nextjs";
import { MotionUI } from "@/components/ui/motion";

interface Doctor {
  _id: number;
  id: number;
  name: string;
  specialty: string;
  image: string;
}

const timeSlots = ["8am-10am", "11am-12pm", "1pm-3pm", "3pm-5pm"];

export default function DoctorsList() {
  const { user, isSignedIn, isLoaded } = useUser();
  const router = useRouter();
  const [userId, setUserId] = useState<string>();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");

  useEffect(() => {
    if (isLoaded && user && user.unsafeMetadata.clientId) {
      console.log(user.unsafeMetadata.clientId)
      setUserId(String(user.unsafeMetadata.clientId))
    }
  }, [isLoaded, user,user?.unsafeMetadata.clientId]);

  useEffect(() => {
    setViewMode(window.innerWidth > 500 ? "grid" : "list");
    setIsLoading(true);
    fetch("/api/mongo/doctor")
      .then((res) => res.json())
      .then((data) => setDoctors(data))
      .catch((error) => console.error("Failed to fetch doctors", error))
      .finally(() => setIsLoading(false));
  }, []);

  const openModal = useCallback(
    (doctor: Doctor) => {
      if (!isSignedIn) return router.push("/login");
      setSelectedDoctor(doctor);
      setIsModalOpen(true);
    },
    [isSignedIn, router]
  );

  const handleConfirmBooking = useCallback(async () => {
    if (!selectedDoctor || !selectedDate || !selectedTime) {
      alert("Please select a doctor, date, and time slot.");
      return;
    }

    const selectedDateObj = new Date(selectedDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selectedDateObj.setHours(0, 0, 0, 0);
    
    if (selectedDateObj <= today || selectedDateObj.getDay() === 0) {
      alert("Invalid date. Select a future date (not Sunday).")
      return;
    }
    
    const appointmentData = {
      patientId: userId,
      doctorName:selectedDoctor.name,
      doctorId: selectedDoctor.id,
      timeSlots: selectedTime,
      dayOfWeek: selectedDateObj.getDay() - 1,
      date: selectedDate,
      status:"Scheduled"
    };

    try {
      const [res1, res2] = await Promise.all([
        fetch("/api/appointment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(appointmentData),
        }),
        fetch("/api/mongo/appointment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(appointmentData),
        }),
      ]);
      if (!res1.ok || !res2.ok) throw new Error("Booking failed.");
      router.push("/dashboard/patient")
    } catch (error) {
      console.error("Error booking appointment:", error);
      alert("An error occurred. Please try again later.");
    }
  }, [selectedDoctor, selectedDate, selectedTime]);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* View Toggle */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="mr-2 text-primary font-bold">View</span>
          <button
            className={`transition-300 rounded p-2 ${
              viewMode === "grid" ? "bg-primary text-secondary" : ""
            }`}
            onClick={() => setViewMode("grid")}
            aria-label="Grid View"
          >
            <LayoutGrid className="h-5 w-5" />
          </button>
          <button
            className={`transition-300 rounded p-2 ${
              viewMode === "list" ? "bg-primary text-secondary" : ""
            }`}
            onClick={() => setViewMode("list")}
            aria-label="List View"
          >
            <List className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Doctors Grid/List View */}
      <MotionUI
        Tag="div"
        className={`flex flex-wrap justify-center gap-6 ${
          viewMode === "list" ? "flex-col items-center" : ""
        }`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        view
      >
        {isLoading
          ? Array.from({ length: 6 }).map((_, index) => (
            <MotionUI
            key={index}
            Tag="div"
            className="transition-300 rounded-lg bg-primary p-4 shadow-md hover:shadow-lg"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            view
          >
            <div
                className="w-60 h-80 rounded-lg animate-pulse"
              ></div>
            
            <button
            disabled
              className="transition-500 mt-4 w-full rounded-lg bg-secondary py-2 text-primary hover:bg-primary border-2 border-secondary hover:text-secondary"
            >
              Book Appointment
            </button>
          </MotionUI>
            ))
          : doctors.map((doctor, index) => (
          <MotionUI
            key={doctor._id}
            Tag="div"
            className="transition-300 min-w-[300px] rounded-lg bg-primary p-4 shadow-md hover:shadow-lg"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            view
          >
            <Image
              src={doctor.image}
              alt={doctor.name}
              className="mb-4 h-48 w-full rounded-md object-cover"
              width={300}
              height={200}
            />
            <h3 className="text-center text-xl font-semibold text-highlight2">
              {doctor.name}
            </h3>
            <p className="text-center text-sm text-secondary">
              {doctor.specialty}
            </p>
            <button
              onClick={() => openModal(doctor)}
              className="transition-500 mt-4 w-full rounded-lg bg-secondary py-2 text-primary hover:bg-primary border-2 border-secondary hover:text-secondary"
            >
              Book Appointment
            </button>
          </MotionUI>
        ))}
      </MotionUI>

      {/* Booking Modal */}
      {isModalOpen && selectedDoctor && (
        <MotionUI
          Tag="div"
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <MotionUI
            Tag="div"
            className="w-[350px] rounded-lg bg-primary   p-6 shadow-lg"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="text-lg font-semibold text-secondary">
              Book Appointment
            </h2>
            <p className="text-sm text-highlight2">{selectedDoctor.name} <span className="text-xs">({selectedDoctor.specialty})</span></p>

            <label className="mt-4 block text-sm font-medium text-card">
              Select Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full rounded-md p-2 text-highlight2 bg-primary focus:outline-none"
              min={new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split("T")[0]}
            />
            <label className="mt-4 block text-sm font-medium text-card">
              Select Time Slot
            </label>
            <select
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              className="w-full rounded-md p-2 text-highlight2 bg-primary focus:outline-none"
            >
              <option value="">Choose a time</option>
              {timeSlots.map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </select>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="transition-500 rounded-md bg-gray-400 px-4 py-2 text-primary hover:bg-black"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmBooking}
                className="transition-500 rounded-md bg-secondary px-4 py-2 text-primary hover:bg-highlight2"
              >
                Confirm
              </button>
            </div>
          </MotionUI>
        </MotionUI>
      )}
    </div>
  );
}

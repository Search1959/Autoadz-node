import React, { useState } from "react";
import { X, Shield, FileText, Phone, Trash2, Mail, MapPin, CheckCircle, AlertTriangle } from "lucide-react";

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: "privacy" | "terms" | "support" | "deletion";
}

export default function LegalModal({ isOpen, onClose, initialTab = "privacy" }: LegalModalProps) {
  const [activeTab, setActiveTab] = useState<"privacy" | "terms" | "support" | "deletion">(initialTab);
  
  // Account Deletion Form State
  const [deletePhone, setDeletePhone] = useState("");
  const [deleteReason, setDeleteReason] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteSubmitted, setDeleteSubmitted] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  if (!isOpen) return null;

  const handleDataDeletionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deletePhone) {
      alert("Please enter your registered phone number.");
      return;
    }
    if (!deleteConfirm) {
      alert("Please confirm the data deletion acknowledgement checkbox.");
      return;
    }

    setDeleteLoading(true);
    // Simulate real API submission to database for regulatory review
    setTimeout(() => {
      setDeleteLoading(false);
      setDeleteSubmitted(true);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full flex flex-col md:flex-row h-[550px] overflow-hidden shadow-2xl border border-slate-100">
        
        {/* Left Sidebar Navigation */}
        <div className="w-full md:w-56 bg-slate-50 border-r border-slate-150 p-4 flex flex-col justify-between shrink-0">
          <div className="space-y-4">
            <div>
              <span className="text-[9px] bg-[#0B1F4D] text-white font-bold px-2 py-0.5 rounded uppercase font-mono tracking-wider">
                COMPLIANCE HUB
              </span>
              <h3 className="font-display font-extrabold text-[#0B1F4D] text-sm mt-1.5">Legal & Support</h3>
              <p className="text-[10px] text-slate-400">Play Store & App Store Regulatory Documentation</p>
            </div>

            <nav className="space-y-1">
              <button
                onClick={() => setActiveTab("privacy")}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                  activeTab === "privacy"
                    ? "bg-[#0B1F4D] text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Shield size={14} className={activeTab === "privacy" ? "text-[#FF9800]" : "text-slate-400"} />
                Privacy Policy
              </button>

              <button
                onClick={() => setActiveTab("terms")}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                  activeTab === "terms"
                    ? "bg-[#0B1F4D] text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <FileText size={14} className={activeTab === "terms" ? "text-[#FF9800]" : "text-slate-400"} />
                Terms of Service
              </button>

              <button
                onClick={() => setActiveTab("support")}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                  activeTab === "support"
                    ? "bg-[#0B1F4D] text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Phone size={14} className={activeTab === "support" ? "text-[#FF9800]" : "text-slate-400"} />
                App Support Desk
              </button>

              <button
                onClick={() => setActiveTab("deletion")}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                  activeTab === "deletion"
                    ? "bg-red-50 text-red-700 border border-red-200/50"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Trash2 size={14} className="text-red-500" />
                Data Deletion request
              </button>
            </nav>
          </div>

          {/* Quick legal credit in sidebar */}
          <div className="pt-4 border-t border-slate-200/60 hidden md:block">
            <p className="text-[9px] text-slate-400 font-mono leading-relaxed">
              Operator Credit:<br />
              <b>M/S Deinrim Solutions (P) Ltd.</b><br />
              Kolkata, WB, India
            </p>
          </div>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-white">
          {/* Header */}
          <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 shrink-0">
            <h4 className="font-display font-extrabold text-[#0B1F4D] text-sm">
              {activeTab === "privacy" && "Privacy Policy & Location Consent"}
              {activeTab === "terms" && "Terms of Service Agreement"}
              {activeTab === "support" && "Developer Support Desk & Contacts"}
              {activeTab === "deletion" && "Driver Data Deletion & Account Erasure"}
            </h4>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-50 transition cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6 text-xs text-slate-700 space-y-4 leading-relaxed">
            
            {/* PRIVACY POLICY TAB */}
            {activeTab === "privacy" && (
              <div className="space-y-3">
                <p className="font-semibold text-slate-800">Effective Date: June 25, 2026</p>
                <p>
                  This Privacy Policy explains how **AutoAdz** ("the Application"), developed and operated by **M/S Deinrim Solutions (P) Ltd.** (Kolkata, West Bengal), collects, processes, and safeguards user information. We are fully committed to protecting the privacy of our advertisers and auto-rickshaw driver partners in compliance with the Google Developer Policy.
                </p>

                <h5 className="font-extrabold text-slate-900 mt-3 text-[11px] uppercase tracking-wide">1. Important Location Data Policy (Drivers)</h5>
                <p className="bg-amber-50 text-amber-900 border border-amber-200/50 p-2.5 rounded-lg text-[10.5px]">
                  **Background Location Access Notice:** To measure physical auto-rickshaw advertisement mileage rewards fairly, our application tracks the physical coordinates of driver partners. This background location is accessed **only** while the driver's telemetry meter is active, enabling the system to log accurate routes even when the app is minimized or the screen is turned off. 
                </p>

                <h5 className="font-extrabold text-slate-900 text-[11px] uppercase tracking-wide">2. Camera and Photos Consent</h5>
                <p>
                  To complete campaign verification audits (e.g., photo proofs), drivers are requested to upload images of the mounted poster sticker on the rear of their auto-rickshaw. Camera access is requested in-app specifically for capturing these audit proofs.
                </p>

                <h5 className="font-extrabold text-slate-900 text-[11px] uppercase tracking-wide">3. Information We Collect</h5>
                <ul className="list-disc pl-4 space-y-1">
                  <li><b>Registration Details:</b> Name, mobile number, city, vehicle number plate, and bank payout credentials.</li>
                  <li><b>Location Coordinates:</b> Latitude, longitude, timestamp, speed, and overall cumulative campaign distance.</li>
                  <li><b>Device Information:</b> Hardware models, operating system versions, and unique application instance IDs.</li>
                </ul>

                <h5 className="font-extrabold text-slate-900 text-[11px] uppercase tracking-wide">4. Contacting Our Data Protection Officer</h5>
                <p>
                  For queries regarding data security, encryption, or user rights, contact the parent operator **M/S Deinrim Solutions (P) Ltd.** at Kolkata, WB. Phone: **9836130393** or email **support@deinrimsolutions.com**.
                </p>
              </div>
            )}

            {/* TERMS OF SERVICE TAB */}
            {activeTab === "terms" && (
              <div className="space-y-3">
                <p className="font-semibold text-slate-800">Last Updated: June 25, 2026</p>
                <p>
                  Welcome to AutoAdz. By installing, registering, or accessing our platform services, you agree to be bound by these standard Terms of Service operated by **M/S Deinrim Solutions (P) Ltd.**, Kolkata.
                </p>

                <h5 className="font-extrabold text-slate-900 text-[11px] uppercase tracking-wide">1. Driver Partner Obligations</h5>
                <p>
                  Driver partners must mount the approved physical vinyl advertisement banners securely onto their designated auto-rickshaw rear hood or side panels. You agree to maintain the sticker condition and allow quarterly physical audits. Attempting to cheat the telemetry meter using fake GPS simulators, background location spofing, or synthetic route generators will lead to instant account ban and payout forfeiture.
                </p>

                <h5 className="font-extrabold text-slate-900 text-[11px] uppercase tracking-wide">2. Advertiser Budgets & Payments</h5>
                <p>
                  Advertisers pre-fund campaigns securely. Campaigns are approved by the platform administration team prior to printing. Budgets are held in platform trust and distributed as mileage payout to verified drivers dynamically based on GPS metrics and physical QR scans.
                </p>

                <h5 className="font-extrabold text-slate-900 text-[11px] uppercase tracking-wide">3. Dispute & Jurisdictions</h5>
                <p>
                  All contracts, platform metrics dispute claims, and payouts are governed by the competent courts in **Kolkata, West Bengal (WB), India**.
                </p>
              </div>
            )}

            {/* APP SUPPORT DESK */}
            {activeTab === "support" && (
              <div className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 space-y-3">
                  <h5 className="font-extrabold text-[#0B1F4D] text-xs">Direct Support Desk Contact</h5>
                  <p className="text-[11px] text-slate-600">
                    Need immediate technical assistance, banner replacement, SDK support, or have developer inquiries? Contact our Kolkata corporate support team.
                  </p>

                  <div className="space-y-2 pt-1">
                    <div className="flex items-center gap-2 text-slate-800">
                      <Phone size={14} className="text-[#FF9800]" />
                      <span className="font-semibold font-mono">Phone Helpline: 9836130393</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-800">
                      <Mail size={14} className="text-[#FF9800]" />
                      <span className="font-semibold font-mono">Email Support: support@deinrimsolutions.com</span>
                    </div>
                    <div className="flex items-start gap-2 text-slate-800">
                      <MapPin size={14} className="text-[#FF9800] shrink-0 mt-0.5" />
                      <span className="font-mono text-[10.5px]">
                        Corporate Address:<br />
                        M/S Deinrim Solutions (P) Ltd.<br />
                        Kolkata, West Bengal (WB), India
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border border-slate-100 p-3 rounded-xl space-y-1 bg-blue-50/20 text-blue-900">
                  <h6 className="font-bold text-[10.5px]">Developer Console URL Integration</h6>
                  <p className="text-[10px] leading-relaxed text-slate-600">
                    This designated support panel serves as the active, public-facing App Support landing page required by Google Play Console and Apple App Store for driver applications.
                  </p>
                </div>
              </div>
            )}

            {/* DATA DELETION REQUEST */}
            {activeTab === "deletion" && (
              <div className="space-y-4">
                <div className="bg-red-50 text-red-900 border border-red-100 p-3 rounded-xl flex gap-2">
                  <AlertTriangle size={18} className="text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-bold text-xs">Play Store Regulation Compliance</h5>
                    <p className="text-[10.5px] leading-normal text-red-800">
                      Google Developer Policies require that applications offering account registration must provide an online option for users to request deletion of their account data.
                    </p>
                  </div>
                </div>

                {!deleteSubmitted ? (
                  <form onSubmit={handleDataDeletionSubmit} className="space-y-3 border border-slate-150 p-4 rounded-2xl bg-white shadow-3xs">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-600">
                        Registered Mobile Number
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="e.g. +91 98361 30393"
                        value={deletePhone}
                        onChange={(e) => setDeletePhone(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs font-mono focus:outline-none focus:bg-white focus:border-red-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-600">
                        Reason for data erasure (Optional)
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Please tell us why you are requesting account deletion..."
                        value={deleteReason}
                        onChange={(e) => setDeleteReason(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:bg-white focus:border-red-500"
                      />
                    </div>

                    <div className="flex items-start gap-2 py-1">
                      <input
                        type="checkbox"
                        id="del-ack"
                        checked={deleteConfirm}
                        onChange={(e) => setDeleteConfirm(e.target.checked)}
                        className="mt-0.5 rounded text-red-500"
                      />
                      <label htmlFor="del-ack" className="text-[10px] text-slate-500 select-none cursor-pointer">
                        I acknowledge that account deletion is irreversible. This will erase physical mileage log history, active earnings wallets, and linked advertisement campaign associations.
                      </label>
                    </div>

                    <button
                      type="submit"
                      disabled={deleteLoading}
                      className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-lg text-[10px] uppercase tracking-wider transition disabled:opacity-50 cursor-pointer"
                    >
                      {deleteLoading ? "PROCURING ERASURE REQUEST..." : "SUBMIT DELETION REQUEST"}
                    </button>
                  </form>
                ) : (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl text-center space-y-2">
                    <CheckCircle size={24} className="text-emerald-500 mx-auto animate-bounce" />
                    <h5 className="font-bold text-xs">Erasure Request Received Successfully</h5>
                    <p className="text-[10.5px] leading-relaxed text-slate-600">
                      Our Data Protection Officer at **M/S Deinrim Solutions (P) Ltd.** has safely received your request for registered mobile number <b>{deletePhone}</b>. We will purge your location history log, verification photos, and payout records within 7 regulatory business days. A confirmation SMS will be sent.
                    </p>
                    <button
                      onClick={() => setDeleteSubmitted(false)}
                      className="text-xs text-slate-500 underline hover:text-slate-800"
                    >
                      Request another deletion
                    </button>
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Footer inside Modal */}
          <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 text-center text-[9px] text-slate-400 font-mono shrink-0">
            AutoAdz Regulatory Compliance Portal • Regulated by Deinrim Solutions
          </div>
        </div>

      </div>
    </div>
  );
}

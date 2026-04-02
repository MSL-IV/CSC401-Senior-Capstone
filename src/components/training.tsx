"use client";

import { Navbar } from "@/components/navbar";
import { SiteFooter } from "@/components/site-footer";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  canonicalMachineName,
  getActualMachineNamesForTraining,
  getRepresentativeCertificateForTraining,
  getTrainingCleanupMachineNames,
  hasTrainingCertificate,
  type NamedMachine,
} from "@/utils/training-machines";

type TrainingCertificate = {
  id: string;
  user_id: string;
  machine_name: string;
  completed_at: string | null;
  expires_at: string | null;
  issued_by: string | null;
  score: number | null;
};

type TrainingMachine = {
  id: string;
  name: string;
  certificateMachineNames: string[];
};

type QuizQuestion = {
  id: string;
  question: string;
  options: string[];
  answer: string;
};

const FALLBACK_EQUIPMENT: TrainingMachine[] = [
  {
    id: "laser-cutter",
    name: "Laser Cutter",
    certificateMachineNames: getActualMachineNamesForTraining("Laser Cutter"),
  },
  {
    id: "milling-machine",
    name: "Milling Machine",
    certificateMachineNames: getActualMachineNamesForTraining("Milling Machine"),
  },
  {
    id: "3d-printer",
    name: "3D Printer",
    certificateMachineNames: getActualMachineNamesForTraining("3D Printer"),
  },
  {
    id: "ultimaker",
    name: "UltiMaker",
    certificateMachineNames: getActualMachineNamesForTraining("UltiMaker"),
  },
  {
    id: "heat-press",
    name: "Heat Press",
    certificateMachineNames: getActualMachineNamesForTraining("Heat Press"),
  },
  {
    id: "vinyl-cutter",
    name: "Vinyl Cutter",
    certificateMachineNames: getActualMachineNamesForTraining("Vinyl Cutter"),
  },
  {
    id: "soldering-station",
    name: "Soldering Station",
    certificateMachineNames: getActualMachineNamesForTraining("Soldering Station"),
  },
];

const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: "q1",
    question: "What is the first thing you should check before operating a machine?",
    options: ["Safety status and workspace readiness", "Maximum print speed", "Playlist volume"],
    answer: "Safety status and workspace readiness",
  },
  {
    id: "q2",
    question: "When should you stop and ask staff for help?",
    options: ["Only after finishing", "If something looks unsafe or unfamiliar", "Never"],
    answer: "If something looks unsafe or unfamiliar",
  },
  {
    id: "q3",
    question: "How should PPE be handled during machine use?",
    options: ["Optional if experienced", "Used as required for the process", "Only during setup"],
    answer: "Used as required for the process",
  },
  {
    id: "q4",
    question: "What should you do after finishing a machine session?",
    options: ["Leave immediately", "Clean up and follow shutdown steps", "Keep the machine running"],
    answer: "Clean up and follow shutdown steps",
  },
  {
    id: "q5",
    question: "What is the minimum score needed to pass this training quiz?",
    options: ["60%", "70%", "80%"],
    answer: "80%",
  },
];

const PASSING_SCORE = 80;
const TEMP_VIDEO_URL = "https://www.pexels.com/download/video/7035591/";
const TRAINING_MACHINES_TABLE = "training_machines";
const supabase = createClient();

export function Training() {
  const [equipment, setEquipment] = useState<TrainingMachine[]>(FALLBACK_EQUIPMENT);
  const [loadingEquipment, setLoadingEquipment] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState("");
  const [activeEquipment, setActiveEquipment] = useState("");

  const [certificateUnlocked, setCertificateUnlocked] = useState(false);
  const [certificate, setCertificate] = useState<TrainingCertificate | null>(null);
  const [loadingCert, setLoadingCert] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [issuedBy, setIssuedBy] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [showCertModal, setShowCertModal] = useState(false);

  const [videoWatched, setVideoWatched] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  const quizPassed = quizScore !== null && quizScore >= PASSING_SCORE;

  const selectedMachine = useMemo(
    () => equipment.find((eq) => eq.name === activeEquipment) ?? null,
    [activeEquipment, equipment]
  );

  useEffect(() => {
    async function loadUser() {
      const { data, error: userError } = await supabase.auth.getUser();
      if (userError || !data.user) {
        setError("You need to be signed in to record training.");
        return;
      }
      setUserId(data.user.id);
      setUserEmail(data.user.email ?? null);
      setIssuedBy(data.user.email ?? data.user.id ?? null);
    }

    loadUser();
  }, []);

  useEffect(() => {
    async function loadEquipment() {
      setLoadingEquipment(true);

      const [{ data, error: equipmentError }, { data: machineData, error: machineError }] =
        await Promise.all([
          supabase
            .from(TRAINING_MACHINES_TABLE)
            .select("id, name")
            .order("name", { ascending: true }),
          supabase.from("machines").select("name").order("name", { ascending: true }),
        ]);

      if (equipmentError) {
        console.error("Failed to load machines:", equipmentError.message);
        setEquipment(FALLBACK_EQUIPMENT);
        setLoadingEquipment(false);
        return;
      }

      if (machineError) {
        console.error("Failed to load reservation machines:", machineError.message);
      }

      if (!data || data.length === 0) {
        setEquipment(FALLBACK_EQUIPMENT);
        setLoadingEquipment(false);
        return;
      }

      const reservableMachines: NamedMachine[] =
        (machineData ?? [])
          .map((machine) => {
            const rawName = typeof machine.name === "string" ? machine.name.trim() : "";
            return rawName ? { name: rawName } : null;
          })
          .filter((machine): machine is NamedMachine => Boolean(machine)) ?? [];

      const dedupedByName = new Map<string, TrainingMachine>();

      for (const machine of data) {
        const rawName = typeof machine.name === "string" ? machine.name.trim() : "";
        if (!rawName) continue;

        const canonical = canonicalMachineName(rawName);
        if (!dedupedByName.has(canonical)) {
          dedupedByName.set(canonical, {
            id: String(machine.id),
            name: rawName,
            certificateMachineNames: getActualMachineNamesForTraining(
              rawName,
              reservableMachines,
            ),
          });
        }
      }

      const deduped = Array.from(dedupedByName.values()).sort((a, b) =>
        a.name.localeCompare(b.name)
      );

      setEquipment(deduped.length > 0 ? deduped : FALLBACK_EQUIPMENT);
      setLoadingEquipment(false);
    }

    loadEquipment();
  }, []);

  useEffect(() => {
    setCertificate(null);
    setCertificateUnlocked(false);
    setShowCertModal(false);
    setVideoWatched(false);
    setAnswers({});
    setQuizScore(null);
    setQuizSubmitted(false);
  }, [activeEquipment]);

  useEffect(() => {
    async function fetchCertificate() {
      if (!userId || !activeEquipment) return;

      setLoadingCert(true);
      setError(null);

      const { data, error: certError } = await supabase
        .from("training_certificates")
        .select("*")
        .eq("user_id", userId);

      if (certError) {
        setError("Couldn't fetch training certificate. Please try again.");
      } else {
        const certs = (data as TrainingCertificate[] | null) ?? [];
        const cert = getRepresentativeCertificateForTraining(
          activeEquipment,
          certs,
          selectedMachine?.certificateMachineNames.map((name) => ({ name })) ?? [],
        );
        setCertificate((cert as TrainingCertificate | null) ?? null);
        setCertificateUnlocked(
          hasTrainingCertificate(activeEquipment, certs, {
            machines:
              selectedMachine?.certificateMachineNames.map((name) => ({ name })) ?? [],
          }),
        );
      }

      setLoadingCert(false);
    }

    fetchCertificate();
  }, [userId, activeEquipment, selectedMachine]);

  const handleSearch = () => {
    if (!selectedEquipment) {
      alert("Please select equipment.");
      return;
    }

    setActiveEquipment(selectedEquipment);
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const handleQuizSubmit = () => {
    if (!videoWatched) {
      setError("Watch the full training video before taking the quiz.");
      return;
    }

    const answeredCount = Object.keys(answers).length;
    if (answeredCount < QUIZ_QUESTIONS.length) {
      setError("Please answer all quiz questions before submitting.");
      return;
    }

    let correct = 0;
    for (const question of QUIZ_QUESTIONS) {
      if (answers[question.id] === question.answer) {
        correct += 1;
      }
    }

    const score = Math.round((correct / QUIZ_QUESTIONS.length) * 100);
    setQuizScore(score);
    setQuizSubmitted(true);
    setError(null);
  };

  const handleCompleteTraining = async () => {
    if (!userId) {
      setError("You need to be signed in to record training.");
      return;
    }

    if (!activeEquipment) {
      setError("Select equipment before completing training.");
      return;
    }

    if (!videoWatched) {
      setError("You must watch the full training video before completing training.");
      return;
    }

    if (!quizPassed) {
      setError(`You must pass the quiz with at least ${PASSING_SCORE}% before completing training.`);
      return;
    }

    setError(null);
    setLoadingCert(true);

    const now = new Date().toISOString();
    const issuedByValue = `${issuedBy ?? "MakerSpace Team"} (Training)`;
    const expiry = new Date();
    expiry.setMonth(expiry.getMonth() + 12);
    const expiresAt = expiry.toISOString();

    const trainingCertificateName = selectedMachine?.name ?? activeEquipment;
    const certificateMachineNames =
      selectedMachine?.certificateMachineNames.length
        ? selectedMachine.certificateMachineNames
        : getActualMachineNamesForTraining(trainingCertificateName);
    const cleanupMachineNames = getTrainingCleanupMachineNames(activeEquipment, [
      ...certificateMachineNames.map((name) => ({ name })),
    ]);

    const { error: deleteError } = await supabase
      .from("training_certificates")
      .delete()
      .eq("user_id", userId)
      .in("machine_name", cleanupMachineNames);

    if (deleteError) {
      console.error("Training certificate cleanup error:", deleteError);
      setError(`Unable to save certificate. ${deleteError.message ?? "Please try again."}`);
      setLoadingCert(false);
      return;
    }

    const { data: inserted, error: insertError } = await supabase
      .from("training_certificates")
      .insert({
        id:
          typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : `${Date.now()}`,
        user_id: userId,
        machine_name: trainingCertificateName,
        completed_at: now,
        expires_at: expiresAt,
        issued_by: issuedByValue,
        score: quizScore,
      })
      .select();

    if (insertError) {
      console.error("Training certificate insert error:", insertError);
      setError(`Unable to save certificate. ${insertError.message ?? "Please try again."}`);
      setLoadingCert(false);
      return;
    }

    const savedCert =
      getRepresentativeCertificateForTraining(
        activeEquipment,
        (inserted as TrainingCertificate[] | null) ?? [],
        certificateMachineNames.map((name) => ({ name })),
      ) ?? null;

    setCertificate((savedCert as TrainingCertificate | null) ?? null);
    setCertificateUnlocked(true);
    setLoadingCert(false);
  };

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--background)", color: "var(--text-primary)" }}
    >
      <Navbar />
      <main className="mx-auto flex max-w-6xl flex-col items-stretch gap-16 px-6 py-20">
        <section
          className="overflow-hidden rounded-3xl border bg-[var(--surface)] shadow-sm"
          style={{
            borderColor: "var(--border)",
            borderRadius: "var(--radius-card)",
            boxShadow: "var(--shadow-soft)",
          }}
        >
          <div className="px-6 pt-12 md:px-20">
            <div className="mx-auto max-w-3xl space-y-4">
              <h1 className="font-heading text-4xl font-bold tracking-tight md:text-5xl">Training</h1>
              <p className="text-lg leading-relaxed md:text-xl" style={{ color: "var(--text-secondary)" }}>
                Choose a machine, watch the required video, and pass the short quiz (80%+) to unlock
                certification.
              </p>
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}
            </div>

            <div
              className="mt-8 h-1 w-full rounded-full"
              style={{
                backgroundImage:
                  "linear-gradient(90deg, var(--primary) 0%, var(--accent) 60%, var(--primary-hover) 100%)",
              }}
            />
          </div>

          <div className="mx-auto mt-10 max-w-md px-5 pb-12">
            <label htmlFor="equipment" className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
              Select Equipment
            </label>
            <select
              id="equipment"
              value={selectedEquipment}
              onChange={(e) => setSelectedEquipment(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm text-[var(--text-primary)] shadow-sm focus:border-[var(--primary)] focus:ring-2 focus:ring-[rgba(200,16,46,0.2)]"
              disabled={loadingEquipment}
            >
              <option value="">{loadingEquipment ? "Loading equipment..." : "-- Choose Equipment --"}</option>
              {equipment.map((eq) => (
                <option key={eq.id} value={eq.name}>
                  {eq.name}
                </option>
              ))}
            </select>
            <button
              onClick={handleSearch}
              disabled={loadingEquipment}
              className={`mt-4 w-full rounded-lg bg-[var(--primary)] px-4 py-2 text-white shadow hover:bg-[var(--primary-hover)] ${
                loadingEquipment ? "opacity-70" : ""
              }`}
            >
              {loadingEquipment ? "Please wait" : "Go"}
            </button>
          </div>

          {activeEquipment && (
            <div className="border-t border-[var(--border)] bg-gradient-to-b from-[rgba(200,16,46,0.03)] to-[rgba(13,45,75,0.02)] px-6 pb-14 pt-10 md:px-20">
              <div className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
                <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm" style={{ boxShadow: "var(--shadow-soft)" }}>
                  <div className="space-y-2">
                    <p className="text-sm font-semibold uppercase tracking-wide text-[var(--primary)]">{selectedMachine?.name ?? activeEquipment}</p>
                    <h2 className="font-heading text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
                      Required Video + Quiz
                    </h2>
                    <p className="text-[15px] leading-relaxed text-[var(--text-secondary)]">
                      Temporary training content is enabled right now. Watch the full video to unlock the quiz,
                      then pass with at least {PASSING_SCORE}%.
                    </p>
                  </div>

                  <div className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4">
                    <p className="mb-3 text-sm font-semibold text-[var(--text-primary)]">1) Locked Training Video</p>
                    <video
                      controls
                      onEnded={() => setVideoWatched(true)}
                      className="h-auto w-full rounded-lg bg-black"
                    >
                      <source src={TEMP_VIDEO_URL} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                    <p className="mt-2 text-xs text-[var(--text-secondary)]">
                      Status: {videoWatched ? "Completed" : "Locked until full video is watched"}
                    </p>
                  </div>

                  <div className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4">
                    <p className="mb-3 text-sm font-semibold text-[var(--text-primary)]">2) Short Quiz</p>
                    {!videoWatched && (
                      <p className="mb-3 text-sm text-[var(--text-secondary)]">
                        Quiz is locked. Finish the video first.
                      </p>
                    )}

                    <div className={`${!videoWatched ? "pointer-events-none opacity-50" : ""} space-y-4`}>
                      {QUIZ_QUESTIONS.map((question) => (
                        <div key={question.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
                          <p className="text-sm font-medium text-[var(--text-primary)]">{question.question}</p>
                          <div className="mt-2 space-y-1">
                            {question.options.map((option) => (
                              <label key={option} className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                                <input
                                  type="radio"
                                  name={question.id}
                                  value={option}
                                  checked={answers[question.id] === option}
                                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                                  disabled={!videoWatched}
                                />
                                {option}
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={handleQuizSubmit}
                      disabled={!videoWatched}
                      className="mt-4 rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)] shadow-sm hover:border-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Submit Quiz
                    </button>

                    {quizSubmitted && quizScore !== null && (
                      <p className={`mt-3 text-sm font-semibold ${quizPassed ? "text-green-700" : "text-red-700"}`}>
                        Quiz score: {quizScore}% {quizPassed ? "(Passed)" : `(Need ${PASSING_SCORE}% to pass)`}
                      </p>
                    )}
                  </div>

                  <div className="mt-6">
                    <button
                      onClick={handleCompleteTraining}
                      disabled={loadingCert || !videoWatched || !quizPassed}
                      className={`rounded-xl bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-white shadow hover:bg-[var(--primary-hover)] ${
                        loadingCert || !videoWatched || !quizPassed ? "opacity-60" : ""
                      }`}
                    >
                      {loadingCert ? "Saving..." : "Mark training complete & unlock certificate"}
                    </button>
                  </div>
                </div>

                <div className="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm" style={{ boxShadow: "var(--shadow-soft)" }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-[var(--text-secondary)]">Certificate Preview</p>
                      <h3 className="text-xl font-semibold text-[var(--text-primary)]">{activeEquipment} Training Completion</h3>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        certificateUnlocked ? "bg-green-100 text-green-800" : "bg-[var(--surface)] text-[var(--text-secondary)]"
                      }`}
                    >
                      {certificateUnlocked ? "Completed" : loadingCert ? "Checking..." : "Locked"}
                    </span>
                  </div>

                  <div className="mt-5 space-y-4 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--background)] p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-[var(--text-primary)]">Participant</p>
                        <p className="text-sm text-[var(--text-secondary)]">MakerSpace Member</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-[var(--text-primary)]">Equipment</p>
                        <p className="text-sm text-[var(--text-secondary)]">{activeEquipment}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 rounded-xl bg-[var(--surface)] px-4 py-3 shadow-inner">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--primary)]/10 font-semibold text-[var(--primary)]">
                        {certificate?.score ?? quizScore ?? PASSING_SCORE}%
                      </div>
                      <p className="text-sm text-[var(--text-secondary)]">
                        {certificateUnlocked
                          ? `Completed on ${certificate?.completed_at ? new Date(certificate.completed_at).toLocaleString() : "-"}`
                          : "Complete video + passing quiz to unlock this certificate."}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm text-[var(--text-secondary)]">
                      <div className="rounded-lg bg-[var(--surface)] px-3 py-2 shadow-inner">
                        <p className="font-semibold text-[var(--text-primary)]">Valid For</p>
                        <p>{certificate?.expires_at ? new Date(certificate.expires_at).toLocaleDateString() : "12 months"}</p>
                      </div>
                      <div className="rounded-lg bg-[var(--surface)] px-3 py-2 shadow-inner">
                        <p className="font-semibold text-[var(--text-primary)]">Issued By</p>
                        <p>{certificate?.issued_by ?? "MakerSpace Team"}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between gap-3 text-sm">
                    <p className="text-[var(--text-secondary)]">
                      Certificate is available after the required video and quiz are completed.
                    </p>
                    <button
                      className={`rounded-lg px-4 py-2 font-semibold shadow ${
                        certificateUnlocked
                          ? "bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]"
                          : "cursor-not-allowed border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)]"
                      }`}
                      disabled={!certificateUnlocked}
                      onClick={() => certificateUnlocked && setShowCertModal(true)}
                    >
                      Generate Certificate
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>
      <SiteFooter />

      {showCertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="relative w-full max-w-md rounded-3xl border border-[var(--border)] bg-white p-6 shadow-2xl">
            <button
              onClick={() => setShowCertModal(false)}
              className="absolute right-3 top-3 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              x
            </button>
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--primary)]">
                  Certificate Generated
                </p>
                <h3 className="mt-1 font-heading text-2xl font-bold text-[var(--text-primary)]">
                  {activeEquipment} Training
                </h3>
                <p className="text-sm text-[var(--text-secondary)]">Save or screenshot for your records.</p>
              </div>
              <div className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[var(--text-primary)]">Participant</span>
                  <span className="text-[var(--text-secondary)]">{userEmail ?? "You"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[var(--text-primary)]">Machine</span>
                  <span className="text-[var(--text-secondary)]">{activeEquipment}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[var(--text-primary)]">Completed</span>
                  <span className="text-[var(--text-secondary)]">
                    {certificate?.completed_at ? new Date(certificate.completed_at).toLocaleString() : "Just now"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[var(--text-primary)]">Expires</span>
                  <span className="text-[var(--text-secondary)]">
                    {certificate?.expires_at ? new Date(certificate.expires_at).toLocaleDateString() : "In 12 months"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[var(--text-primary)]">Issued By</span>
                  <span className="text-[var(--text-secondary)]">
                    {certificate?.issued_by ?? `${issuedBy ?? "MakerSpace Team"} (Training)`}
                  </span>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => setShowCertModal(false)}
                  className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white shadow hover:bg-[var(--primary-hover)]"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Training;

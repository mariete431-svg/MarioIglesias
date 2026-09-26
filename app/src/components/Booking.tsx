import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, Download } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { useMotionPreference } from "@/components/EditorialEffects";
import { bookingClient, dayKey, downloadCalendarEvent, formatDay, formatTime } from "@/lib/appointments";

const steps = ["Día", "Hora", "Tus datos", "Confirmación"];
const weekdays = ["L", "M", "X", "J", "V", "S", "D"];
const bookingSchema = z.object({
  name: z.string().trim().min(1, "Escribe tu nombre.").max(100, "El nombre es demasiado largo."),
  email: z.string().trim().email("Escribe un correo válido.").max(255, "El correo es demasiado largo."),
  phone: z.string().trim().max(30, "El teléfono es demasiado largo."),
  topic: z.string().trim().max(1000, "El mensaje es demasiado largo."),
  consent: z.literal(true, { errorMap: () => ({ message: "Necesitamos tu consentimiento para reservar." }) }),
});
type Field = "name" | "email" | "phone" | "topic" | "consent";
type Form = { name: string; email: string; phone: string; topic: string; consent: boolean };

export function Booking() {
  const reduced = useMotionPreference();
  const today = dayKey(new Date());
  const [monthOffset, setMonthOffset] = useState(0);
  const [step, setStep] = useState(0);
  const [available, setAvailable] = useState<string[]>([]);
  const [daysLoading, setDaysLoading] = useState(true);
  const [daysError, setDaysError] = useState("");
  const [selectedDay, setSelectedDay] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [form, setForm] = useState<Form>({ name: "", email: "", phone: "", topic: "", consent: false });
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmedEmail, setConfirmedEmail] = useState("");
  const [retryDays, setRetryDays] = useState(0);
  const [retrySlots, setRetrySlots] = useState(0);

  const currentMonth = useMemo(() => {
    const [year = 2026, month = 1] = today.split("-").map(Number);
    return new Date(Date.UTC(year, month - 1 + monthOffset, 1, 12));
  }, [today, monthOffset]);
  const year = currentMonth.getUTCFullYear();
  const month = currentMonth.getUTCMonth();
  const first = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const last = dayKey(new Date(Date.UTC(year, month + 1, 0, 12)));
  const from = first > today ? first : today;
  const monthLabel = new Intl.DateTimeFormat("es-ES", { month: "long", year: "numeric", timeZone: "UTC" }).format(currentMonth);

  useEffect(() => {
    let active = true;
    setDaysLoading(true);
    setDaysError("");
    bookingClient.rpc("get_available_days", { p_from: from, p_to: last }).then(({ data, error }) => {
      if (!active) return;
      setDaysLoading(false);
      if (error) { setDaysError("No se ha podido cargar el calendario. Inténtalo de nuevo."); setAvailable([]); }
      else setAvailable(Array.isArray(data) ? data : []);
    });
    return () => { active = false; };
  }, [from, last, retryDays]);

  useEffect(() => {
    if (!selectedDay) return;
    let active = true;
    setSlotsLoading(true);
    setSlotsError("");
    bookingClient.rpc("get_available_slots", { p_day: selectedDay }).then(({ data, error }) => {
      if (!active) return;
      setSlotsLoading(false);
      if (error) { setSlotsError("No se han podido cargar las horas. Inténtalo de nuevo."); setSlots([]); }
      else setSlots(Array.isArray(data) ? data.map((item: { starts_at: string }) => item.starts_at) : []);
    });
    return () => { active = false; };
  }, [selectedDay, retrySlots]);

  const cells = useMemo(() => {
    const lead = (new Date(Date.UTC(year, month, 1)).getUTCDay() + 6) % 7;
    const count = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    return [...Array(lead).fill(null), ...Array.from({ length: count }, (_, i) => `${year}-${String(month + 1).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`)] as (string | null)[];
  }, [year, month]);

  const setField = (field: Field, value: string | boolean) => {
    setForm(previous => ({ ...previous, [field]: value }));
    setErrors(previous => ({ ...previous, [field]: undefined }));
    setSubmitError("");
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting || !selectedSlot) return;
    const result = bookingSchema.safeParse(form);
    if (!result.success) {
      const next: Partial<Record<Field, string>> = {};
      result.error.issues.forEach(issue => { const field = issue.path[0] as Field; if (!next[field]) next[field] = issue.message; });
      setErrors(next);
      return;
    }
    setSubmitting(true);
    setSubmitError("");
    const { error } = await bookingClient.rpc("book_appointment", {
      p_name: result.data.name,
      p_email: result.data.email,
      p_phone: result.data.phone || null,
      p_topic: result.data.topic || null,
      p_starts_at: selectedSlot,
    });
    setSubmitting(false);
    if (error) {
      if (error.message.includes("slot_unavailable")) {
        setSelectedSlot("");
        setRetrySlots(value => value + 1);
        setStep(1);
        setSubmitError("Esa hora acaba de ocuparse. Elige otra disponible.");
      } else if (error.message.includes("too_many")) {
        setSubmitError("Ya hay varias reuniones pendientes con este correo. Escríbele a Mario para organizar otra.");
      } else setSubmitError("No hemos podido completar la reserva. Inténtalo de nuevo.");
      return;
    }
    setConfirmedEmail(result.data.email);
    setStep(3);
  };

  const reset = () => {
    setSelectedDay(""); setSelectedSlot(""); setConfirmedEmail(""); setErrors({}); setSubmitError("");
    setForm({ name: "", email: "", phone: "", topic: "", consent: false });
    setMonthOffset(0); setRetryDays(value => value + 1); setStep(0);
  };

  return <div className="booking-panel">
    <div className="booking-progress" aria-label={`Paso ${step + 1} de 4`}>
      <div className="booking-step-labels">{steps.map((label, index) => <span key={label} className={index === step ? "active" : index < step ? "complete" : ""}><small>{index + 1}</small> {label}</span>)}</div>
      <div className="progress-track"><div style={{ width: `${((step + 1) / 4) * 100}%` }} /></div>
    </div>
    <div className="booking-grid">
      <aside className="booking-summary">
        <span className="eyebrow">ENCUENTRO PERSONAL</span>
        <h3>Un momento para<br /><em>conversar.</em></h3>
        <div className="summary-lines">
          <p>Reunión de 30 minutos</p><p>Por teléfono o videollamada</p><p>Hora de Canarias</p>
        </div>
        <div className="summary-selection">
          <span className="eyebrow">TU SELECCIÓN</span>
          <p>{selectedDay ? formatDay(selectedDay) : "Elige un día para empezar"}</p>
          {selectedSlot && <p>{formatTime(selectedSlot)} · hora de Canarias</p>}
        </div>
      </aside>
      <div className="booking-main" aria-live="polite">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={step} initial={reduced ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={reduced ? {} : { opacity: 0, y: -8 }} transition={{ duration: .26 }}>
            {step === 0 && <>
              <span className="eyebrow">PASO 01 / 04</span><h3>Elige un día.</h3>
              <div className="calendar-heading"><strong>{monthLabel}</strong><div><Button variant="calendarNav" size="icon" aria-label="Mes anterior" disabled={monthOffset === 0} onClick={() => setMonthOffset(value => value - 1)}><ChevronLeft /></Button><Button variant="calendarNav" size="icon" aria-label="Mes siguiente" disabled={monthOffset === 2} onClick={() => setMonthOffset(value => value + 1)}><ChevronRight /></Button></div></div>
              <div className="calendar-grid" role="grid" aria-label={`Disponibilidad de ${monthLabel}`}>
                {weekdays.map(day => <span className="weekday" key={day}>{day}</span>)}
                {cells.map((date, index) => date ? <Button key={date} variant="calendarDay" className={`${date === today ? "today" : ""} ${selectedDay === date ? "selected" : ""} ${daysLoading ? "loading-day" : ""}`} disabled={daysLoading || !available.includes(date) || date < today} onClick={() => { setSelectedDay(date); setSelectedSlot(""); setStep(1); }} aria-label={`${formatDay(date)}${available.includes(date) ? ", disponible" : ", no disponible"}`} aria-pressed={selectedDay === date}>{selectedDay === date && <motion.span layoutId="selected-calendar-day" className="selected-day-pill" transition={{ type: "spring", stiffness: 300, damping: 30 }} />}<span className="day-number">{Number(date.slice(-2))}</span>{!daysLoading && available.includes(date) && <i />}</Button> : <span key={`empty-${index}`} />)}
              </div>
              {daysLoading && <p className="status-text">Consultando disponibilidad…</p>}
              {daysError && <div className="status-text error" role="alert">{daysError} <Button variant="text" onClick={() => setRetryDays(value => value + 1)}>Reintentar <ArrowRight /></Button></div>}
              {!daysLoading && !daysError && available.length === 0 && <p className="status-text">No hay huecos este mes. Consulta el mes siguiente.</p>}
            </>}
            {step === 1 && <>
              <span className="eyebrow">PASO 02 / 04</span><h3>Elige una hora.</h3>
              <p className="step-subtitle">{selectedDay && formatDay(selectedDay)} · hora de Canarias</p>
              {submitError && <p className="status-text error" role="alert">{submitError}</p>}
              {slotsLoading ? <div className="slots-grid">{Array.from({ length: 8 }, (_, i) => <span className="slot-skeleton" key={i} />)}</div> : <>
                {slotsError && <p className="status-text error" role="alert">{slotsError} <Button variant="text" onClick={() => setRetrySlots(value => value + 1)}>Reintentar <ArrowRight /></Button></p>}
                {!slotsError && slots.length === 0 && <p className="status-text">Ya no quedan horas para este día. Elige otro.</p>}
                <motion.div className="slots-grid" initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: reduced ? 0 : .045 } } }}>{slots.map(slot => <motion.div key={slot} variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}><Button variant={selectedSlot === slot ? "slotSelected" : "slot"} onClick={() => selectedSlot === slot ? setStep(2) : setSelectedSlot(slot)}>{formatTime(slot)}{selectedSlot === slot && <span>— Confirmar <ArrowRight /></span>}</Button></motion.div>)}</motion.div>
              </>}
              <Button variant="text" className="back-button" onClick={() => { setSelectedSlot(""); setStep(0); }}><ArrowLeft /> Volver al día</Button>
            </>}
            {step === 2 && <>
              <span className="eyebrow">PASO 03 / 04</span><h3>Tus datos.</h3>
              <p className="step-subtitle">Solo lo necesario para ponernos en contacto.</p>
              <form className="booking-form" onSubmit={submit} noValidate>
                <div className="form-row"><label htmlFor="booking-name">Nombre <span>*</span></label><input id="booking-name" autoComplete="name" maxLength={100} value={form.name} onChange={e => setField("name", e.target.value)} aria-invalid={!!errors.name} aria-describedby={errors.name ? "name-error" : undefined} placeholder="Tu nombre" />{errors.name && <small id="name-error" role="alert">{errors.name}</small>}</div>
                <div className="form-row"><label htmlFor="booking-email">Email <span>*</span></label><input id="booking-email" type="email" autoComplete="email" maxLength={255} value={form.email} onChange={e => setField("email", e.target.value)} aria-invalid={!!errors.email} aria-describedby={errors.email ? "email-error" : undefined} placeholder="tu@email.com" />{errors.email && <small id="email-error" role="alert">{errors.email}</small>}</div>
                <div className="form-row"><label htmlFor="booking-phone">Teléfono <span className="optional">Opcional</span></label><input id="booking-phone" type="tel" autoComplete="tel" maxLength={30} value={form.phone} onChange={e => setField("phone", e.target.value)} aria-invalid={!!errors.phone} placeholder="+34" />{errors.phone && <small role="alert">{errors.phone}</small>}</div>
                <div className="form-row"><label htmlFor="booking-topic">¿De qué quieres hablar? <span className="optional">Opcional</span></label><textarea id="booking-topic" rows={3} maxLength={1000} value={form.topic} onChange={e => setField("topic", e.target.value)} aria-invalid={!!errors.topic} placeholder="Cuéntame brevemente…" />{errors.topic && <small role="alert">{errors.topic}</small>}</div>
                <label className="consent-row"><input type="checkbox" checked={form.consent} onChange={e => setField("consent", e.target.checked)} aria-invalid={!!errors.consent} /><span>Acepto que Mario use estos datos solo para contactarme sobre esta reunión.</span></label>
                {errors.consent && <small className="form-error" role="alert">{errors.consent}</small>}
                {submitError && <p className="form-error" role="alert">{submitError}</p>}
                <div className="form-actions"><Button type="button" variant="text" onClick={() => setStep(1)}><ArrowLeft /> Volver a la hora</Button><Button type="submit" variant="luxury" disabled={submitting}>{submitting ? "Confirmando…" : "Confirmar reunión"} {!submitting && <ArrowRight />}</Button></div>
              </form>
            </>}
            {step === 3 && <div className="confirmation">
              <motion.div className="confirmation-check" initial={reduced ? false : { opacity: 0, scale: .9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: .55 }}><motion.svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><motion.path d="M5 12.5l4.3 4.2L19 7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" initial={reduced ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: .25, duration: .75, ease: "easeInOut" }} /></motion.svg></motion.div>
              <span className="eyebrow">PASO 04 / 04</span><h3>Nos vemos pronto.</h3>
              <p>Reunión reservada. Nos vemos el {formatDay(selectedDay)} a las {formatTime(selectedSlot)} (hora de Canarias). Te escribiré a <strong>{confirmedEmail}</strong> para confirmarla.</p>
              <div className="confirmation-actions"><Button variant="luxury" onClick={() => downloadCalendarEvent(selectedSlot)}><Download /> Añadir a mi calendario</Button><Button variant="outlineLuxury" onClick={reset}>Reservar otra <ArrowRight /></Button></div>
            </div>}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  </div>;
}

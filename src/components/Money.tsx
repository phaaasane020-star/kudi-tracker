/** A cedi amount with a smaller currency sign and quieter pesewas, as on a bank statement. */
export default function Money({ value, sign = "", className = "" }: { value: number; sign?: "" | "+" | "−"; className?: string }) {
  const [whole, pesewas] = Math.abs(value)
    .toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    .split(".");
  return (
    <span className={`tabular whitespace-nowrap ${className}`}>
      {sign}
      <span className="mr-[0.12em] align-[0.42em] text-[0.42em] font-semibold opacity-70">GH₵</span>
      {whole}
      <span className="opacity-55">.{pesewas}</span>
    </span>
  );
}

import { statuses } from "@/lib/labels";

export default function StatusChip({ status }) {
  return <span className={`chip s-${status}`}>{statuses[status] || status}</span>;
}

import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  ChartNoAxesColumnIncreasing,
  Check,
  CreditCard,
  Download,
  ChevronDown,
  Copy,
  Layers2,
  Link2,
  LockKeyhole,
  Menu,
  PencilLine,
  Power,
  QrCode,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";

const icons = {
  arrowDown: ArrowDown,
  arrowRight: ArrowRight,
  arrowUpRight: ArrowUpRight,
  calendar: CalendarDays,
  chart: ChartNoAxesColumnIncreasing,
  check: Check,
  creditCard: CreditCard,
  download: Download,
  chevronDown: ChevronDown,
  copy: Copy,
  layers: Layers2,
  link: Link2,
  lock: LockKeyhole,
  menu: Menu,
  edit: PencilLine,
  power: Power,
  qr: QrCode,
  shield: ShieldCheck,
  sparkles: Sparkles,
  close: X,
};

export default function Icon({ name, size = 20, strokeWidth = 1.75, className = "" }) {
  const IconComponent = icons[name] || Link2;
  return <IconComponent aria-hidden="true" focusable="false" size={size} strokeWidth={strokeWidth} className={className} />;
}

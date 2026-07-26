"use client";

export default function PasswordChecklist(props) {
  var password = props.password;

  var rules = [
    { label: "At least 8 characters", test: password.length >= 8 },
    { label: "One uppercase letter", test: /[A-Z]/.test(password) },
    { label: "One lowercase letter", test: /[a-z]/.test(password) },
    { label: "One number", test: /[0-9]/.test(password) },
    { label: "One special character", test: /[^A-Za-z0-9]/.test(password) },
  ];

  return (
    <ul className="space-y-1 text-xs">
      {rules.map(function (rule, i) {
        return (
          <li key={i} className={rule.test ? "text-led" : "text-text-muted"}>
            {rule.test ? "\u2713" : "\u25CB"} {rule.label}
          </li>
        );
      })}
    </ul>
  );
}

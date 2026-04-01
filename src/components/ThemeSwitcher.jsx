import { useTheme } from "../context/ThemeContext";

export function ThemeSwitcher() {
  const { theme, setTheme, themes } = useTheme();

  const themeOptions = [
    { value: themes.DEFAULT, label: "Default" },
    { value: themes.DARK, label: "Dark" },
    { value: themes.GLASS, label: "Glass" },
  ];

  return (
    <div className="themeSwitcher">
      {themeOptions.map((option) => (
        <button
          key={option.value}
          className={`themeSwitcherBtn ${theme === option.value ? "active" : ""}`}
          onClick={() => setTheme(option.value)}
          aria-label={`Switch to ${option.label} theme`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

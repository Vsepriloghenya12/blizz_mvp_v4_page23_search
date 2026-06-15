# Icon System Skill — Blizz

## Principle

All action/navigation icons must look like one family.

## Preferred Direction

Use one outline icon system, ideally `lucide-react-native` or a single internal SVG/icon component set approved for the project.

## Rules

- Size: usually 22–24 px for actions, 24 px for tabs, 28–32 px only for hero/primary actions.
- Stroke: consistent visual weight, normally around 2 px.
- Color: default `Text Primary`, active `Primary`, disabled `Text Secondary`.
- Do not mix emoji, text symbols, random PNG icons, and hand-built View icons.
- Do not use icon images extracted from generated mockups.
- If an icon is ambiguous, use text label or stronger context.

## Visual Pass Requirement

When a screen is redesigned, list every icon on that screen and specify:

- name;
- source library/component;
- size;
- active/inactive state;
- press target.

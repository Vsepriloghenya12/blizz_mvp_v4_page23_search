import * as React from 'react';
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Path,
  Rect,
  Stop,
  type SvgProps,
} from 'react-native-svg';

export type BlizzIconProps = SvgProps & {
  size?: number;
  color?: string;
  accentColor?: string;
  mutedColor?: string;
  active?: boolean;
  filled?: boolean;
  fillColor?: string;
  strokeWidth?: number;
};

const MUTED = '#94A3B8';
const ACCENT = '#2563EB';
const ACCENT_2 = '#38BDF8';
const RED = '#EF4444';

function base({
  size = 24,
  color = '#101828',
  strokeWidth = 1.9,
  ...props
}: BlizzIconProps) {
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: color,
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    ...props,
  };
}

export function HomeIcon(props: BlizzIconProps) {
  const active = props.active ?? props.filled ?? false;
  const color = props.color ?? '#101828';
  const accent = props.accentColor ?? props.fillColor ?? ACCENT;
  return (
    <Svg {...base({ ...props, color })}>
      <Defs>
        <LinearGradient id="homeAccent" x1="8" y1="17" x2="14" y2="17">
          <Stop offset="0" stopColor={accent} />
          <Stop offset="1" stopColor={ACCENT_2} />
        </LinearGradient>
      </Defs>
      <Path d="M3.85 10.25L12 3.45l8.15 6.8" />
      <Path d="M5.95 9.65v9.05c0 .82.64 1.45 1.45 1.45h9.2c.81 0 1.45-.63 1.45-1.45V9.65" />
      <Path d="M9.45 20.15v-5.35c0-.75.6-1.35 1.35-1.35h2.4c.75 0 1.35.6 1.35 1.35v5.35" />
      <Path d="M9.55 19.95v-4.85c0-.48.38-.86.86-.86h3.18c.48 0 .86.38.86.86v4.85" stroke={active ? 'url(#homeAccent)' : color} strokeWidth={active ? 2.35 : 2.1} />
      {active ? <Circle cx="12" cy="21.45" r="1" fill={accent} stroke="none" /> : null}
    </Svg>
  );
}

export function VideoIcon(props: BlizzIconProps) {
  const active = props.active ?? props.filled ?? false;
  const color = props.color ?? '#101828';
  const accent = props.accentColor ?? props.fillColor ?? ACCENT;
  return (
    <Svg {...base({ ...props, color })}>
      <Defs>
        <LinearGradient id="videoPlay" x1="9" y1="10" x2="15" y2="14">
          <Stop offset="0" stopColor={ACCENT_2} />
          <Stop offset="1" stopColor={accent} />
        </LinearGradient>
      </Defs>
      <Rect x="4.35" y="7.15" width="15.3" height="12" rx="2.2" />
      <Path d="M5.15 7.25l1.35-3.1 3.15 3.1" />
      <Path d="M9.65 7.25l1.35-3.1 3.15 3.1" />
      <Path d="M14.15 7.25l1.35-3.1 3.15 3.1" />
      <Path d="M10 10.7l4.55 2.75L10 16.2v-5.5z" fill="url(#videoPlay)" stroke={active ? 'url(#videoPlay)' : 'none'} />
    </Svg>
  );
}

export function CreateIcon(props: BlizzIconProps) {
  const size = props.size ?? 24;
  const accent = props.accentColor ?? ACCENT;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Defs>
        <LinearGradient id="createBg" x1="5" y1="4" x2="19" y2="20">
          <Stop offset="0" stopColor="#60A5FA" />
          <Stop offset="0.55" stopColor={accent} />
          <Stop offset="1" stopColor="#4C1D95" />
        </LinearGradient>
        <LinearGradient id="createGlow" x1="7" y1="5" x2="16" y2="18">
          <Stop offset="0" stopColor="#BAE6FD" />
          <Stop offset="1" stopColor="#60A5FA" />
        </LinearGradient>
      </Defs>
      <Circle cx="12" cy="12" r="8.75" fill="url(#createBg)" />
      <Circle cx="9.35" cy="7.6" r="2.9" fill="url(#createGlow)" opacity={0.34} />
      <Path d="M12 7.35v9.3M7.35 12h9.3" stroke="#F8FAFC" strokeWidth={2.15} strokeLinecap="round" />
      <Circle cx="12" cy="12" r="8.75" stroke="#93C5FD" strokeWidth={1.15} opacity={0.9} />
    </Svg>
  );
}

export function MapIcon(props: BlizzIconProps) {
  const active = props.active ?? props.filled ?? false;
  const color = props.color ?? '#101828';
  const accent = props.accentColor ?? props.fillColor ?? ACCENT;
  return (
    <Svg {...base({ ...props, color })}>
      <Defs>
        <LinearGradient id="pinGradient" x1="12" y1="3" x2="12" y2="13">
          <Stop offset="0" stopColor={ACCENT_2} />
          <Stop offset="1" stopColor={accent} />
        </LinearGradient>
      </Defs>
      <Path d="M4.45 8.25l4.1-1.8 6.9 2.85 4.1-1.8v10.15l-4.1 1.85-6.9-2.85-4.1 1.85V8.25z" />
      <Path d="M8.55 6.45v10.2" />
      <Path d="M15.45 9.3v10.2" />
      <Path d="M12 4.35c2.2 0 3.95 1.7 3.95 3.85 0 2.8-3.95 6.05-3.95 6.05S8.05 11 8.05 8.2c0-2.15 1.75-3.85 3.95-3.85z" fill="url(#pinGradient)" stroke={active ? '#BFDBFE' : 'url(#pinGradient)'} />
      <Circle cx="12" cy="8.1" r="1.25" fill="#FFFFFF" stroke="none" />
    </Svg>
  );
}

export function ProfileIcon(props: BlizzIconProps) {
  const active = props.active ?? props.filled ?? false;
  const color = props.color ?? '#101828';
  const accent = props.accentColor ?? props.fillColor ?? ACCENT;
  return (
    <Svg {...base({ ...props, color })}>
      <Defs>
        <LinearGradient id="profileFill" x1="8" y1="12" x2="16" y2="20">
          <Stop offset="0" stopColor="#60A5FA" />
          <Stop offset="1" stopColor={accent} />
        </LinearGradient>
      </Defs>
      <Circle cx="12" cy="12" r="9.15" />
      <Circle cx="12" cy="8.5" r="2.65" fill={active ? 'url(#profileFill)' : 'none'} stroke={active ? 'url(#profileFill)' : color} />
      <Path d="M7.55 17.6c.8-2.2 2.25-3.35 4.45-3.35s3.65 1.15 4.45 3.35" fill={active ? 'url(#profileFill)' : 'none'} stroke={active ? 'url(#profileFill)' : color} />
    </Svg>
  );
}

export function LikeIcon(props: BlizzIconProps) {
  const active = props.active ?? props.filled ?? false;
  const color = props.color ?? '#101828';
  return (
    <Svg {...base({ ...props, color })}>
      <Defs>
        <LinearGradient id="likeFill" x1="6" y1="5" x2="18" y2="19">
          <Stop offset="0" stopColor="#FB7185" />
          <Stop offset="1" stopColor={RED} />
        </LinearGradient>
      </Defs>
      <Path
        d="M12 20.2s-7.65-4.55-8.65-9.4C2.82 8.2 4.35 5.75 7.1 5.75c1.85 0 3.18 1.02 3.9 2.45.4.78 1.6.78 2 0 .72-1.43 2.05-2.45 3.9-2.45 2.75 0 4.28 2.45 3.75 5.05C19.65 15.65 12 20.2 12 20.2z"
        fill={active ? 'url(#likeFill)' : 'none'}
        stroke={active ? 'url(#likeFill)' : color}
      />
      {!active ? <Path d="M7.25 7.65c-1 .25-1.7 1.15-1.7 2.35" stroke="#FCA5A5" strokeWidth={1.25} /> : null}
    </Svg>
  );
}

export function CommentIcon(props: BlizzIconProps) {
  const active = props.active ?? props.filled ?? false;
  const color = props.color ?? '#101828';
  const muted = props.mutedColor ?? MUTED;
  return (
    <Svg {...base({ ...props, color })}>
      <Path d="M5.25 6.65c1.42-1.62 3.55-2.6 6.18-2.6 4.75 0 8.22 3.08 8.22 7.2s-3.47 7.18-8.22 7.18c-.86 0-1.68-.1-2.45-.32l-4.18 2.05.86-3.75a6.65 6.65 0 01-2.05-5.16c0-1.78.57-3.35 1.64-4.6z" fill={active ? '#0F172A' : 'none'} />
      <Circle cx="9.1" cy="11.25" r="0.75" fill={muted} stroke="none" />
      <Circle cx="12" cy="11.25" r="0.75" fill={muted} stroke="none" />
      <Circle cx="14.9" cy="11.25" r="0.75" fill={muted} stroke="none" />
    </Svg>
  );
}

export function ShareIcon(props: BlizzIconProps) {
  const active = props.active ?? props.filled ?? false;
  const color = props.color ?? '#101828';
  const accent = props.accentColor ?? props.fillColor ?? ACCENT;
  return (
    <Svg {...base({ ...props, color })}>
      <Defs>
        <LinearGradient id="shareEdge" x1="9" y1="11" x2="17" y2="19">
          <Stop offset="0" stopColor={ACCENT_2} />
          <Stop offset="1" stopColor={accent} />
        </LinearGradient>
      </Defs>
      <Path d="M20.35 4.25L3.9 11.45c-.58.25-.55 1.1.05 1.3l6.15 2.05 2.05 6.15c.2.6 1.05.63 1.3.05l7.2-16.45c.08-.2-.1-.38-.3-.3z" />
      <Path d="M10.25 14.75l4.95-4.95" stroke="url(#shareEdge)" strokeWidth={active ? 2.45 : 2.1} />
      <Path d="M12.2 20.55l.95-6.1" stroke="url(#shareEdge)" opacity={active ? 1 : 0.75} />
    </Svg>
  );
}

export function SaveIcon(props: BlizzIconProps) {
  const active = props.active ?? props.filled ?? false;
  const color = props.color ?? '#101828';
  const accent = props.accentColor ?? props.fillColor ?? ACCENT;
  return (
    <Svg {...base({ ...props, color })}>
      <Defs>
        <LinearGradient id="saveFill" x1="8" y1="7" x2="16" y2="18">
          <Stop offset="0" stopColor="#60A5FA" />
          <Stop offset="1" stopColor={accent} />
        </LinearGradient>
      </Defs>
      <Path d="M7.1 4.55h9.8c.82 0 1.45.64 1.45 1.45v14.05l-6.35-3.8-6.35 3.8V6c0-.81.63-1.45 1.45-1.45z" fill={active ? 'url(#saveFill)' : 'none'} />
      {!active ? <Path d="M8.9 6.35h6.2" stroke={accent} opacity={0.65} /> : null}
    </Svg>
  );
}

export function MessageIcon(props: BlizzIconProps) {
  const active = props.active ?? props.filled ?? false;
  const color = props.color ?? '#101828';
  const accent = props.accentColor ?? props.fillColor ?? ACCENT;
  return (
    <Svg {...base({ ...props, color })}>
      <Path d="M5 7.1c0-.9.72-1.62 1.62-1.62h10.76c.9 0 1.62.72 1.62 1.62v7.35c0 .9-.72 1.62-1.62 1.62h-5.2l-4.6 3.2v-3.2h-.96c-.9 0-1.62-.72-1.62-1.62V7.1z" />
      <Path d="M8.4 9.25h7.2" stroke={accent} />
      <Path d="M8.4 12.2h4.7" stroke={accent} opacity={0.8} />
      {active ? <Circle cx="17.4" cy="6" r="1.65" fill={accent} stroke="none" /> : null}
    </Svg>
  );
}

export function MoreIcon(props: BlizzIconProps) {
  const color = props.color ?? '#101828';
  return (
    <Svg {...base({ ...props, color })}>
      <Circle cx="6.5" cy="12" r="1.15" fill={color} stroke="none" />
      <Circle cx="12" cy="12" r="1.15" fill={color} stroke="none" />
      <Circle cx="17.5" cy="12" r="1.15" fill={color} stroke="none" />
    </Svg>
  );
}

export function BackIcon(props: BlizzIconProps) {
  const color = props.color ?? '#101828';
  return (
    <Svg {...base({ ...props, color })}>
      <Path d="M14.85 5.15L8 12l6.85 6.85" />
      <Path d="M8.45 12h11.1" />
    </Svg>
  );
}

export function CloseIcon(props: BlizzIconProps) {
  const color = props.color ?? '#101828';
  return (
    <Svg {...base({ ...props, color })}>
      <Path d="M6.1 6.1l11.8 11.8" />
      <Path d="M17.9 6.1L6.1 17.9" />
    </Svg>
  );
}

export function SearchIcon(props: BlizzIconProps) {
  const color = props.color ?? '#101828';
  const accent = props.accentColor ?? props.fillColor ?? ACCENT;
  return (
    <Svg {...base({ ...props, color })}>
      <Circle cx="10.65" cy="10.65" r="6.3" />
      <Path d="M15.15 15.15l4.5 4.5" />
      <Path d="M17.35 17.35l2.3 2.3" stroke={accent} strokeWidth={2.45} />
    </Svg>
  );
}

export function NotificationIcon(props: BlizzIconProps) {
  const active = props.active ?? props.filled ?? false;
  const color = props.color ?? '#101828';
  const accent = props.accentColor ?? props.fillColor ?? ACCENT;
  return (
    <Svg {...base({ ...props, color })}>
      <Path d="M7.35 10.35c0-3.05 1.85-5.1 4.65-5.1s4.65 2.05 4.65 5.1v3.05l1.25 2.15H6.1l1.25-2.15v-3.05z" />
      <Path d="M10.35 18.2c.32.8.9 1.25 1.65 1.25s1.33-.45 1.65-1.25" />
      <Path d="M12 5.25V3.8" />
      <Circle cx="17.2" cy="5.55" r="2.05" fill={accent} stroke="none" />
    </Svg>
  );
}

export function PlusIcon(props: BlizzIconProps) {
  const color = props.color ?? '#101828';
  return (
    <Svg {...base({ ...props, color })}>
      <Path d="M12 5v14" />
      <Path d="M5 12h14" />
    </Svg>
  );
}

export function PinIcon(props: BlizzIconProps) {
  const active = props.active ?? props.filled ?? false;
  const color = props.color ?? '#101828';
  const accent = props.accentColor ?? props.fillColor ?? ACCENT;
  return (
    <Svg {...base({ ...props, color })}>
      <Defs>
        <LinearGradient id="pinIconGradient" x1="12" y1="3" x2="12" y2="21">
          <Stop offset="0" stopColor={ACCENT_2} />
          <Stop offset="1" stopColor={accent} />
        </LinearGradient>
      </Defs>
      <Path d="M12 3.65c3.45 0 6.25 2.68 6.25 6 0 4.62-6.25 10.7-6.25 10.7S5.75 14.27 5.75 9.65c0-3.32 2.8-6 6.25-6z" fill={active ? 'url(#pinIconGradient)' : 'none'} stroke={active ? 'url(#pinIconGradient)' : color} />
      <Circle cx="12" cy="9.6" r="2.05" stroke={active ? '#E0F2FE' : accent} />
    </Svg>
  );
}

export function SettingsIcon(props: BlizzIconProps) {
  const active = props.active ?? props.filled ?? false;
  const color = props.color ?? '#101828';
  const accent = props.accentColor ?? props.fillColor ?? ACCENT;
  return (
    <Svg {...base({ ...props, color })}>
      <Path d="M19.15 13.4c.05-.45.05-.95 0-1.4l2.05-1.6-2.05-3.55-2.5 1a7.2 7.2 0 00-2.2-1.28L14.08 3.9H9.92l-.37 2.67a7.2 7.2 0 00-2.2 1.28l-2.5-1L2.8 10.4 4.85 12c-.05.45-.05.95 0 1.4L2.8 15l2.05 3.55 2.5-1a7.2 7.2 0 002.2 1.28l.37 2.67h4.16l.37-2.67a7.2 7.2 0 002.2-1.28l2.5 1L21.2 15l-2.05-1.6z" />
      <Circle cx="12" cy="12" r="2.85" stroke={active ? accent : color} />
      <Circle cx="12" cy="12" r="1.15" fill={accent} stroke="none" />
    </Svg>
  );
}

export function SendIcon(props: BlizzIconProps) {
  const color = props.color ?? '#101828';
  const accent = props.accentColor ?? props.fillColor ?? ACCENT;
  return (
    <Svg {...base({ ...props, color })}>
      <Path d="M20.35 4.25L3.9 11.45c-.58.25-.55 1.1.05 1.3l6.15 2.05 2.05 6.15c.2.6 1.05.63 1.3.05l7.2-16.45c.08-.2-.1-.38-.3-.3z" />
      <Path d="M10.25 14.75l4.95-4.95" stroke={accent} />
    </Svg>
  );
}

export function EyeIcon(props: BlizzIconProps) {
  const color = props.color ?? '#101828';
  return (
    <Svg {...base({ ...props, color })}>
      <Path d="M2.8 12s3.4-6 9.2-6 9.2 6 9.2 6-3.4 6-9.2 6-9.2-6-9.2-6Z" />
      <Circle cx="12" cy="12" r="2.7" />
    </Svg>
  );
}

export function EyeOffIcon(props: BlizzIconProps) {
  const color = props.color ?? '#101828';
  return (
    <Svg {...base({ ...props, color })}>
      <Path d="M3 3l18 18" />
      <Path d="M10.6 10.6A2.1 2.1 0 0 0 12 15.6a2.1 2.1 0 0 0 1.4-.5" />
      <Path d="M7.7 7.9C5.7 9.1 4.1 10.9 3 12c1.9 2.5 4.8 5 9 5 1.5 0 2.8-.3 4-.9" />
      <Path d="M10.2 5.2A9.8 9.8 0 0 1 12 5c4.2 0 7.1 2.5 9 5-.6.8-1.5 1.8-2.6 2.7" />
    </Svg>
  );
}

export function LockIcon(props: BlizzIconProps) {
  const color = props.color ?? '#101828';
  return (
    <Svg {...base({ ...props, color })}>
      <Rect height="10" rx="2.5" width="15" x="4.5" y="10.5" />
      <Path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
      <Circle cx="12" cy="15.2" fill={color} r="1" stroke="none" />
      <Path d="M12 16.2v1.7" />
    </Svg>
  );
}

export function SmartphoneIcon(props: BlizzIconProps) {
  const color = props.color ?? '#101828';
  return (
    <Svg {...base({ ...props, color })}>
      <Rect height="18" rx="2.5" width="11" x="6.5" y="3" />
      <Path d="M10 6h4" />
      <Circle cx="12" cy="17.6" fill={color} r=".8" stroke="none" />
    </Svg>
  );
}

export function FilterIcon(props: BlizzIconProps) {
  const color = props.color ?? '#101828';
  const accent = props.accentColor ?? props.fillColor ?? ACCENT;
  return (
    <Svg {...base({ ...props, color })}>
      <Path d="M4.35 7.05h15.3" />
      <Path d="M4.35 12h15.3" />
      <Path d="M4.35 16.95h15.3" />
      <Circle cx="14.8" cy="7.05" r="1.35" fill={accent} stroke="#BFDBFE" strokeWidth={1.1} />
      <Circle cx="8.75" cy="12" r="1.35" fill={accent} stroke="#BFDBFE" strokeWidth={1.1} />
      <Circle cx="13.2" cy="16.95" r="1.35" fill={accent} stroke="#BFDBFE" strokeWidth={1.1} />
    </Svg>
  );
}

export function StoriesIcon(props: BlizzIconProps) {
  const active = props.active ?? props.filled ?? false;
  const color = props.color ?? '#101828';
  const accent = props.accentColor ?? props.fillColor ?? ACCENT;
  return (
    <Svg {...base({ ...props, color })}>
      <Circle cx="12" cy="12" r="8.35" strokeDasharray="3.1 3.1" stroke={active ? accent : color} />
      <Path d="M12 7.85v8.3" stroke={accent} />
      <Path d="M7.85 12h8.3" stroke={accent} />
    </Svg>
  );
}

export function ShowcaseIcon(props: BlizzIconProps) {
  const active = props.active ?? props.filled ?? false;
  const color = props.color ?? '#101828';
  const accent = props.accentColor ?? props.fillColor ?? ACCENT;
  return (
    <Svg {...base({ ...props, color })}>
      <Path d="M6.15 10.1h11.7v8.15c0 .8-.62 1.42-1.42 1.42H7.57c-.8 0-1.42-.62-1.42-1.42V10.1z" />
      <Path d="M5.25 10.1l.9-4.55h11.7l.9 4.55" />
      <Path d="M5.25 10.1c.7 1.18 2.5 1.18 3.2 0 .7 1.18 2.5 1.18 3.2 0 .7 1.18 2.5 1.18 3.2 0 .7 1.18 2.5 1.18 3.2 0" fill={active ? accent : 'none'} stroke={active ? accent : color} />
      <Path d="M9.65 19.67v-4.05c0-.55.42-.98.98-.98h2.74c.56 0 .98.43.98.98v4.05" stroke={accent} />
    </Svg>
  );
}

export function OfferIcon(props: BlizzIconProps) {
  const active = props.active ?? props.filled ?? false;
  const color = props.color ?? '#101828';
  const accent = props.accentColor ?? props.fillColor ?? ACCENT;
  return (
    <Svg {...base({ ...props, color })}>
      <Path d="M4.8 12.65l7.85-7.85h6.1v6.1L10.9 18.75c-.58.58-1.5.58-2.08 0L4.8 14.73c-.58-.58-.58-1.5 0-2.08z" fill={active ? '#0F172A' : 'none'} />
      <Circle cx="16.6" cy="6.95" r="1.25" fill={accent} stroke={active ? accent : color} />
      <Path d="M8.35 14.1l5.75-5.75" stroke={accent} />
    </Svg>
  );
}

export function BusinessIcon(props: BlizzIconProps) {
  const active = props.active ?? props.filled ?? false;
  const color = props.color ?? '#101828';
  const accent = props.accentColor ?? props.fillColor ?? ACCENT;
  return (
    <Svg {...base({ ...props, color })}>
      <Rect x="5" y="8.2" width="14" height="10.9" rx="1.8" />
      <Path d="M8.65 8.2V6.25c0-.75.58-1.35 1.33-1.35h4.04c.75 0 1.33.6 1.33 1.35V8.2" />
      <Path d="M5 12.25c1.68 1.05 3.9 1.58 7 1.58s5.32-.53 7-1.58" />
      <Rect x="10.75" y="12.65" width="2.5" height="2" rx="0.55" fill={accent} stroke={active ? accent : color} />
    </Svg>
  );
}

export function GroupIcon(props: BlizzIconProps) {
  const color = props.color ?? '#101828';
  const accent = props.accentColor ?? props.fillColor ?? ACCENT;
  return (
    <Svg {...base({ ...props, color })}>
      <Circle cx="12" cy="8.2" r="2.45" />
      <Circle cx="6.85" cy="10.05" r="1.9" />
      <Circle cx="17.15" cy="10.05" r="1.9" />
      <Path d="M7.75 18.65c.58-2.42 2-3.65 4.25-3.65s3.67 1.23 4.25 3.65" />
      <Path d="M3.85 17.25c.5-1.85 1.55-2.78 3.15-2.78" />
      <Path d="M20.15 17.25c-.5-1.85-1.55-2.78-3.15-2.78" />
      <Circle cx="12" cy="8.2" r="0.8" fill={accent} stroke="none" opacity={0.85} />
    </Svg>
  );
}

export function StatsIcon(props: BlizzIconProps) {
  const color = props.color ?? '#101828';
  const accent = props.accentColor ?? props.fillColor ?? ACCENT;
  return (
    <Svg {...base({ ...props, color })}>
      <Path d="M4.8 19.2V4.8" />
      <Path d="M4.8 19.2h14.4" />
      <Path d="M7.4 15.6l3.35-3.75 3.05 2.35 4.5-6.1" stroke={accent} />
      <Path d="M15.9 8.1h2.4v2.4" stroke={accent} />
    </Svg>
  );
}

export type BlizzIconName =
  | 'home' | 'video' | 'create' | 'map' | 'profile'
  | 'like' | 'comment' | 'share' | 'save' | 'message'
  | 'more' | 'back' | 'close' | 'search' | 'filter'
  | 'notification' | 'settings' | 'stories' | 'pin'
  | 'showcase' | 'offer' | 'business' | 'group' | 'stats'
  | 'plus' | 'send' | 'eye' | 'eyeOff' | 'lock' | 'smartphone'
  // backward-compat aliases
  | 'bell' | 'notificationBell' | 'moreHorizontal' | 'chevronLeft'
  | 'mapPin' | 'x' | 'play' | 'bookmark' | 'user' | 'heart';

export const BlizzIcons: Record<BlizzIconName, React.ComponentType<BlizzIconProps>> = {
  home: HomeIcon, video: VideoIcon, create: CreateIcon, map: MapIcon, profile: ProfileIcon,
  like: LikeIcon, comment: CommentIcon, share: ShareIcon, save: SaveIcon, message: MessageIcon,
  more: MoreIcon, back: BackIcon, close: CloseIcon, search: SearchIcon, filter: FilterIcon,
  notification: NotificationIcon, settings: SettingsIcon, stories: StoriesIcon, pin: PinIcon,
  showcase: ShowcaseIcon, offer: OfferIcon, business: BusinessIcon, group: GroupIcon, stats: StatsIcon,
  plus: PlusIcon, send: SendIcon, eye: EyeIcon, eyeOff: EyeOffIcon, lock: LockIcon, smartphone: SmartphoneIcon,
  // aliases
  bell: NotificationIcon, notificationBell: NotificationIcon,
  moreHorizontal: MoreIcon, chevronLeft: BackIcon, mapPin: PinIcon,
  x: CloseIcon, play: VideoIcon, bookmark: SaveIcon, user: ProfileIcon, heart: LikeIcon,
};

export function BlizzIcon({ name, ...props }: BlizzIconProps & { name: BlizzIconName }) {
  const Icon = BlizzIcons[name];
  return <Icon {...props} />;
}

export const blizzIconSizes = {
  micro: 14, feed: 20, header: 22, navigation: 24, create: 28,
} as const;

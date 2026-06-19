import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';

export const blizzIconSizes = {
  micro: 14,
  feed: 20,
  header: 22,
  navigation: 24,
  create: 28
} as const;

export type BlizzIconName =
  | 'bell'
  | 'bookmark'
  | 'chevronLeft'
  | 'close'
  | 'comment'
  | 'eye'
  | 'eyeOff'
  | 'heart'
  | 'home'
  | 'lock'
  | 'mapPin'
  | 'message'
  | 'moreHorizontal'
  | 'notificationBell'
  | 'play'
  | 'plus'
  | 'profile'
  | 'search'
  | 'send'
  | 'share'
  | 'smartphone'
  | 'user'
  | 'video'
  | 'x';

type BlizzIconProps = {
  name: BlizzIconName;
  size?: number;
  color?: string;
  filled?: boolean;
  fillColor?: string;
  /** @deprecated BlizzIcon uses the shared 1.8-unit optical stroke. */
  strokeWidth?: number;
};

const OPTICAL_STROKE = 1.8;

export function BlizzIcon({
  name,
  size = blizzIconSizes.navigation,
  color = '#101828',
  filled = false,
  fillColor
}: BlizzIconProps) {
  const activeColor = fillColor ?? color;
  const commonProps = {
    fill: 'none',
    stroke: color,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    strokeWidth: OPTICAL_STROKE
  };

  const icon = (() => {
    switch (name) {
      case 'search':
        return (
          <>
            <Circle cx="10.5" cy="10.5" r="5.9" {...commonProps} />
            <Path d="m14.9 14.9 4.8 4.8" {...commonProps} />
          </>
        );
      case 'bell':
      case 'notificationBell':
        return filled ? (
          <>
            <Path d="M5.2 16.7h13.6l-1.7-3.1v-3.2a5.1 5.1 0 0 0-10.2 0v3.2l-1.7 3.1Z" fill={activeColor} />
            <Path d="M9.7 18.6a2.5 2.5 0 0 0 4.6 0" fill={activeColor} stroke={activeColor} strokeLinecap="round" strokeWidth={OPTICAL_STROKE} />
          </>
        ) : (
          <>
            <Path d="M5.2 16.7h13.6l-1.7-3.1v-3.2a5.1 5.1 0 0 0-10.2 0v3.2l-1.7 3.1Z" {...commonProps} />
            <Path d="M9.7 18.6a2.5 2.5 0 0 0 4.6 0" {...commonProps} />
          </>
        );
      case 'message':
        return (
          <Path
            d="M5.1 6.6c0-1 .7-1.7 1.7-1.7h10.4c1 0 1.7.7 1.7 1.7v7c0 1-.7 1.7-1.7 1.7H10l-5 3.6.9-4.2c-.5-.3-.8-.9-.8-1.5V6.6Z"
            {...commonProps}
            fill={filled ? activeColor : 'none'}
            stroke={filled ? activeColor : color}
          />
        );
      case 'comment':
        return <Path d="M5.2 6.5c0-1 .7-1.7 1.7-1.7h10.2c1 0 1.7.7 1.7 1.7v6.8c0 1-.7 1.7-1.7 1.7H10l-4.8 3.5.8-4c-.5-.3-.8-.8-.8-1.4V6.5Z" {...commonProps} />;
      case 'heart':
        return (
          <Path
            d="M19.4 8.8c0 5-7.4 9.6-7.4 9.6S4.6 13.8 4.6 8.8A4.1 4.1 0 0 1 12 6.4a4.1 4.1 0 0 1 7.4 2.4Z"
            {...commonProps}
            fill={filled ? activeColor : 'none'}
            stroke={filled ? activeColor : color}
          />
        );
      case 'share':
        return (
          <>
            <Path d="M5 12.5v5.8c0 .7.5 1.2 1.2 1.2h11.6c.7 0 1.2-.5 1.2-1.2v-5.8" {...commonProps} />
            <Path d="M12 15.5V4.7m-3.8 3.7L12 4.7l3.8 3.7" {...commonProps} />
          </>
        );
      case 'send':
        return (
          <>
            <Path d="m4.4 5.1 15.3 6.4a.6.6 0 0 1 0 1.1L4.4 18.9a.7.7 0 0 1-.9-.8l1.2-4.8 8.2-1.3-8.2-1.3-1.2-4.8a.7.7 0 0 1 .9-.8Z" {...commonProps} />
          </>
        );
      case 'bookmark':
        return (
          <Path
            d="M7 5.2c0-.7.5-1.2 1.2-1.2h7.6c.7 0 1.2.5 1.2 1.2v14.5L12 16.5l-5 3.2V5.2Z"
            {...commonProps}
            fill={filled ? activeColor : 'none'}
            stroke={filled ? activeColor : color}
          />
        );
      case 'moreHorizontal':
        return (
          <>
            <Circle cx="6.4" cy="12" fill={color} r="1.2" />
            <Circle cx="12" cy="12" fill={color} r="1.2" />
            <Circle cx="17.6" cy="12" fill={color} r="1.2" />
          </>
        );
      case 'mapPin':
        return filled ? (
          <>
            <Path d="M12 21s6.1-5.2 6.1-10.8a6.1 6.1 0 1 0-12.2 0C5.9 15.8 12 21 12 21Z" fill={activeColor} />
            <Circle cx="12" cy="10.1" fill="#FFFFFF" r="2.1" />
          </>
        ) : (
          <>
            <Path d="M12 21s6.1-5.2 6.1-10.8a6.1 6.1 0 1 0-12.2 0C5.9 15.8 12 21 12 21Z" {...commonProps} />
            <Circle cx="12" cy="10.1" r="2.1" {...commonProps} />
          </>
        );
      case 'home':
        return filled ? (
          <>
            <Path d="m4.2 11.2 7.8-6.8 7.8 6.8v7.1c0 1-.7 1.7-1.7 1.7H5.9c-1 0-1.7-.7-1.7-1.7v-7.1Z" fill={activeColor} />
            <Path d="M9.7 20v-5.7c0-.6.4-1 1-1h2.6c.6 0 1 .4 1 1V20" fill="#FFFFFF" />
          </>
        ) : (
          <>
            <Path d="m4.2 11.2 7.8-6.8 7.8 6.8v7.1c0 1-.7 1.7-1.7 1.7H5.9c-1 0-1.7-.7-1.7-1.7v-7.1Z" {...commonProps} />
            <Path d="M9.7 20v-5.7c0-.6.4-1 1-1h2.6c.6 0 1 .4 1 1V20" {...commonProps} />
          </>
        );
      case 'play':
      case 'video':
        return filled ? (
          <Path d="M7.4 5.6c0-1.1 1.1-1.7 2-1.1l8.7 5.7c.8.5.8 1.7 0 2.2l-8.7 5.7c-.9.6-2-.1-2-1.1V5.6Z" fill={activeColor} />
        ) : (
          <Path d="M7.4 5.6c0-1.1 1.1-1.7 2-1.1l8.7 5.7c.8.5.8 1.7 0 2.2l-8.7 5.7c-.9.6-2-.1-2-1.1V5.6Z" {...commonProps} />
        );
      case 'plus':
        return (
          <>
            <Path d="M12 5v14" {...commonProps} />
            <Path d="M5 12h14" {...commonProps} />
          </>
        );
      case 'profile':
      case 'user':
        return filled ? (
          <>
            <Circle cx="12" cy="8.1" fill={activeColor} r="3.8" />
            <Path d="M5 19.7c.7-3.6 3-5.4 7-5.4s6.3 1.8 7 5.4c.1.5-.3.9-.8.9H5.8c-.5 0-.9-.4-.8-.9Z" fill={activeColor} />
          </>
        ) : (
          <>
            <Circle cx="12" cy="8.1" r="3.8" {...commonProps} />
            <Path d="M5 20c.7-3.8 3-5.7 7-5.7s6.3 1.9 7 5.7" {...commonProps} />
          </>
        );
      case 'smartphone':
        return (
          <>
            <Rect height="18" rx="2.5" {...commonProps} width="11" x="6.5" y="3" />
            <Path d="M10 6h4" {...commonProps} />
            <Circle cx="12" cy="17.6" fill={color} r=".8" />
          </>
        );
      case 'lock':
        return (
          <>
            <Rect height="10" rx="2.5" {...commonProps} width="15" x="4.5" y="10.5" />
            <Path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" {...commonProps} />
            <Circle cx="12" cy="15.2" fill={color} r="1" />
            <Path d="M12 16.2v1.7" {...commonProps} />
          </>
        );
      case 'chevronLeft':
        return <Path d="m15 19-7-7 7-7" {...commonProps} />;
      case 'close':
      case 'x':
        return (
          <>
            <Line x1="18" y1="6" x2="6" y2="18" {...commonProps} />
            <Line x1="6" y1="6" x2="18" y2="18" {...commonProps} />
          </>
        );
      case 'eyeOff':
        return (
          <>
            <Path d="M3 3l18 18" {...commonProps} />
            <Path d="M10.6 10.6A2.1 2.1 0 0 0 12 15.6a2.1 2.1 0 0 0 1.4-.5" {...commonProps} />
            <Path d="M7.7 7.9C5.7 9.1 4.1 10.9 3 12c1.9 2.5 4.8 5 9 5 1.5 0 2.8-.3 4-.9" {...commonProps} />
            <Path d="M10.2 5.2A9.8 9.8 0 0 1 12 5c4.2 0 7.1 2.5 9 5-.6.8-1.5 1.8-2.6 2.7" {...commonProps} />
          </>
        );
      case 'eye':
        return (
          <>
            <Path d="M2.8 12s3.4-6 9.2-6 9.2 6 9.2 6-3.4 6-9.2 6-9.2-6-9.2-6Z" {...commonProps} />
            <Circle cx="12" cy="12" r="2.7" {...commonProps} />
          </>
        );
      default:
        return null;
    }
  })();

  if (!icon) {
    return null;
  }

  return (
    <Svg height={size} viewBox="0 0 24 24" width={size}>
      {icon}
    </Svg>
  );
}

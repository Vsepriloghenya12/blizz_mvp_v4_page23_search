import Svg, { Circle, Path, Rect } from 'react-native-svg';

export type BlizzIconName =
  | 'bell'
  | 'bookmark'
  | 'comment'
  | 'eye'
  | 'eyeOff'
  | 'heart'
  | 'home'
  | 'lock'
  | 'mapPin'
  | 'message'
  | 'moreHorizontal'
  | 'play'
  | 'plus'
  | 'search'
  | 'share'
  | 'smartphone'
  | 'user';

type BlizzIconProps = {
  name: BlizzIconName;
  size?: number;
  color?: string;
  filled?: boolean;
  fillColor?: string;
  strokeWidth?: number;
};

export function BlizzIcon({ name, size = 24, color = '#0B1220', filled = false, fillColor, strokeWidth = 2.2 }: BlizzIconProps) {
  const commonProps = {
    fill: 'none',
    stroke: color,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    strokeWidth
  };

  if (name === 'search') {
    return (
      <Svg height={size} viewBox="0 0 24 24" width={size}>
        <Circle cx="10.8" cy="10.8" r="6.3" {...commonProps} />
        <Path d="M15.5 15.5 20 20" {...commonProps} />
      </Svg>
    );
  }

  if (name === 'bell') {
    return (
      <Svg height={size} viewBox="0 0 24 24" width={size}>
        <Path d="M7 10a5 5 0 0 1 10 0v2.9l2 3.4H5l2-3.4V10Z" {...commonProps} fill={filled ? fillColor || color : 'none'} />
        <Path d="M10 19a2.4 2.4 0 0 0 4 0" {...commonProps} />
      </Svg>
    );
  }

  if (name === 'message' || name === 'comment') {
    return (
      <Svg height={size} viewBox="0 0 24 24" width={size}>
        <Path d="M5 6.8c0-1.1.7-1.8 1.8-1.8h10.4c1.1 0 1.8.7 1.8 1.8v7.1c0 1.1-.7 1.8-1.8 1.8H10l-5 3.5.9-4.1c-.6-.3-.9-.9-.9-1.6V6.8Z" {...commonProps} fill={filled ? fillColor || color : 'none'} />
      </Svg>
    );
  }

  if (name === 'heart') {
    return (
      <Svg height={size} viewBox="0 0 24 24" width={size}>
        <Path d="M19.4 8.9c0 5-7.4 9.4-7.4 9.4S4.6 13.9 4.6 8.9A4.1 4.1 0 0 1 12 6.5a4.1 4.1 0 0 1 7.4 2.4Z" {...commonProps} fill={filled ? fillColor || color : 'none'} />
      </Svg>
    );
  }

  if (name === 'share') {
    return (
      <Svg height={size} viewBox="0 0 24 24" width={size}>
        <Path d="M5 12.2v6.2h14v-6.2" {...commonProps} />
        <Path d="M12 5v10.4" {...commonProps} />
        <Path d="M8.3 8.6 12 5l3.7 3.6" {...commonProps} />
      </Svg>
    );
  }

  if (name === 'bookmark') {
    return (
      <Svg height={size} viewBox="0 0 24 24" width={size}>
        <Path d="M7.1 5.1c0-.6.4-1 1-1h7.8c.6 0 1 .4 1 1v14.4L12 16.4l-4.9 3.1V5.1Z" {...commonProps} fill={filled ? fillColor || color : 'none'} />
      </Svg>
    );
  }

  if (name === 'moreHorizontal') {
    return (
      <Svg height={size} viewBox="0 0 24 24" width={size}>
        <Circle cx="6.5" cy="12" fill={color} r="1.3" stroke="none" />
        <Circle cx="12" cy="12" fill={color} r="1.3" stroke="none" />
        <Circle cx="17.5" cy="12" fill={color} r="1.3" stroke="none" />
      </Svg>
    );
  }

  if (name === 'mapPin') {
    return (
      <Svg height={size} viewBox="0 0 24 24" width={size}>
        <Path d="M12 21s6.1-5.2 6.1-10.8a6.1 6.1 0 1 0-12.2 0C5.9 15.8 12 21 12 21Z" {...commonProps} fill={filled ? fillColor || color : 'none'} />
        <Circle cx="12" cy="10.2" r="2.1" {...commonProps} />
      </Svg>
    );
  }

  if (name === 'home') {
    return (
      <Svg height={size} viewBox="0 0 24 24" width={size}>
        <Path d="M4.5 11.2 12 4.7l7.5 6.5v7.5c0 .7-.5 1.2-1.2 1.2H5.7c-.7 0-1.2-.5-1.2-1.2v-7.5Z" {...commonProps} fill={filled ? fillColor || color : 'none'} />
        <Path d="M9.2 19.8v-6h5.6v6" {...commonProps} />
      </Svg>
    );
  }

  if (name === 'play') {
    return (
      <Svg height={size} viewBox="0 0 24 24" width={size}>
        <Path d="M8.2 5.6c0-.8.9-1.3 1.6-.9l8.5 5.3c.7.4.7 1.5 0 1.9l-8.5 5.4c-.7.4-1.6-.1-1.6-.9V5.6Z" {...commonProps} fill={filled ? fillColor || color : 'none'} />
      </Svg>
    );
  }

  if (name === 'plus') {
    return (
      <Svg height={size} viewBox="0 0 24 24" width={size}>
        <Path d="M12 5v14" {...commonProps} />
        <Path d="M5 12h14" {...commonProps} />
      </Svg>
    );
  }

  if (name === 'user') {
    return (
      <Svg height={size} viewBox="0 0 24 24" width={size}>
        <Circle cx="12" cy="8.6" r="3.8" {...commonProps} fill={filled ? fillColor || color : 'none'} />
        <Path d="M5.4 20c.8-3.3 3.1-5.1 6.6-5.1s5.8 1.8 6.6 5.1" {...commonProps} />
      </Svg>
    );
  }

  if (name === 'smartphone') {
    return (
      <Svg height={size} viewBox="0 0 24 24" width={size}>
        <Rect height="18" rx="3" {...commonProps} width="11" x="6.5" y="3" />
        <Path d="M10 6h4" {...commonProps} />
        <Circle cx="12" cy="17.6" fill={color} r="0.8" stroke="none" />
      </Svg>
    );
  }

  if (name === 'lock') {
    return (
      <Svg height={size} viewBox="0 0 24 24" width={size}>
        <Rect height="10" rx="2.5" {...commonProps} width="15" x="4.5" y="10.5" />
        <Path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" {...commonProps} />
        <Circle cx="12" cy="15.2" fill={color} r="1" stroke="none" />
        <Path d="M12 16.2v1.7" {...commonProps} />
      </Svg>
    );
  }

  if (name === 'eyeOff') {
    return (
      <Svg height={size} viewBox="0 0 24 24" width={size}>
        <Path d="M3 3l18 18" {...commonProps} />
        <Path d="M10.6 10.6A2.1 2.1 0 0 0 12 15.6a2.1 2.1 0 0 0 1.4-.5" {...commonProps} />
        <Path d="M7.7 7.9C5.7 9.1 4.1 10.9 3 12c1.9 2.5 4.8 5 9 5 1.5 0 2.8-.3 4-.9" {...commonProps} />
        <Path d="M10.2 5.2A9.8 9.8 0 0 1 12 5c4.2 0 7.1 2.5 9 5-.6.8-1.5 1.8-2.6 2.7" {...commonProps} />
      </Svg>
    );
  }

  return (
    <Svg height={size} viewBox="0 0 24 24" width={size}>
      <Path d="M2.8 12s3.4-6 9.2-6 9.2 6 9.2 6-3.4 6-9.2 6-9.2-6-9.2-6Z" {...commonProps} />
      <Circle cx="12" cy="12" {...commonProps} r="2.7" />
    </Svg>
  );
}

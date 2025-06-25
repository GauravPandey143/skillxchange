import avatar from '../assets/avatar.svg';

export default function ProfileAvatar({ src, alt = "Profile", ...props }) {
  return (
    <img
      src={src && src.trim() ? src : avatar}
      alt={alt}
      {...props}
    />
  );
}
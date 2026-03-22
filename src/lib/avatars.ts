import wolfAvatar from "@/assets/avatars/wolf.png";
import foxAvatar from "@/assets/avatars/fox.png";
import owlAvatar from "@/assets/avatars/owl.png";
import dragonAvatar from "@/assets/avatars/dragon.png";
import phoenixAvatar from "@/assets/avatars/phoenix.png";
import pantherAvatar from "@/assets/avatars/panther.png";
import bearAvatar from "@/assets/avatars/bear.png";
import hawkAvatar from "@/assets/avatars/hawk.png";
import lionAvatar from "@/assets/avatars/lion.png";
import serpentAvatar from "@/assets/avatars/serpent.png";

export interface AvatarOption {
  id: string;
  label: string;
  src: string;
}

export const AVATAR_OPTIONS: AvatarOption[] = [
  { id: "wolf", label: "Wolf", src: wolfAvatar },
  { id: "fox", label: "Fox", src: foxAvatar },
  { id: "owl", label: "Owl", src: owlAvatar },
  { id: "dragon", label: "Dragon", src: dragonAvatar },
  { id: "phoenix", label: "Phoenix", src: phoenixAvatar },
  { id: "panther", label: "Panther", src: pantherAvatar },
  { id: "bear", label: "Bear", src: bearAvatar },
  { id: "hawk", label: "Hawk", src: hawkAvatar },
  { id: "lion", label: "Lion", src: lionAvatar },
  { id: "serpent", label: "Serpent", src: serpentAvatar },
];

export function getAvatarById(id: string | null | undefined): AvatarOption | undefined {
  return AVATAR_OPTIONS.find(a => a.id === id);
}

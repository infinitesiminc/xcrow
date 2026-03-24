import wolfAvatar from "@/assets/avatars/wolf.webp";
import foxAvatar from "@/assets/avatars/fox.webp";
import owlAvatar from "@/assets/avatars/owl.webp";
import dragonAvatar from "@/assets/avatars/dragon.webp";
import phoenixAvatar from "@/assets/avatars/phoenix.webp";
import pantherAvatar from "@/assets/avatars/panther.webp";
import bearAvatar from "@/assets/avatars/bear.webp";
import hawkAvatar from "@/assets/avatars/hawk.webp";
import lionAvatar from "@/assets/avatars/lion.webp";
import serpentAvatar from "@/assets/avatars/serpent.webp";
import scorpionAvatar from "@/assets/avatars/scorpion.webp";
import sharkAvatar from "@/assets/avatars/shark.webp";

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
  { id: "scorpion", label: "Scorpion", src: scorpionAvatar },
  { id: "shark", label: "Shark", src: sharkAvatar },
];

export function getAvatarById(id: string | null | undefined): AvatarOption | undefined {
  return AVATAR_OPTIONS.find(a => a.id === id);
}

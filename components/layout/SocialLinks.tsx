import type { IconType } from "react-icons";
import { FaFacebookF, FaInstagram, FaTiktok, FaXTwitter, FaYoutube } from "react-icons/fa6";
import type { SocialLinks as SocialLinksDTO } from "@salasty-thrift-closet/shared";
import { cn } from "@/lib/utils";

const SOCIAL: { key: keyof SocialLinksDTO; label: string; icon: IconType }[] = [
  { key: "facebook", label: "Facebook", icon: FaFacebookF },
  { key: "instagram", label: "Instagram", icon: FaInstagram },
  { key: "tiktok", label: "TikTok", icon: FaTiktok },
  { key: "x", label: "X", icon: FaXTwitter },
  { key: "youtube", label: "YouTube", icon: FaYoutube },
];

/** Only the accounts filled in under Admin → Settings appear. */
export function SocialLinks({ links, className, linkClassName }: { links: SocialLinksDTO; className?: string; linkClassName?: string }) {
  const socials = SOCIAL.filter(({ key }) => links[key]);
  if (!socials.length) return null;
  return (
    <ul className={cn("flex", className)} aria-label="Social media">
      {socials.map(({ key, label, icon: Icon }) => (
        <li key={key}>
          <a href={links[key]} target="_blank" rel="noopener noreferrer" aria-label={label} className={cn("flex items-center justify-center rounded-full transition-colors", linkClassName)}>
            <Icon className="size-4" aria-hidden="true" />
          </a>
        </li>
      ))}
    </ul>
  );
}

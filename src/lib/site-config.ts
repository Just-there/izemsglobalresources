/**
 * Central site configuration for IZEMS Global Resources Ltd.
 * Update contact details / social links here in one place.
 */
export const siteConfig = {
  name: "IZEMS Global Resources Ltd",
  shortName: "IZEMS",
  tagline: "Premium Steel & Building Materials",
  description:
    "Trusted supplier of premium steel pipes, structural beams and industrial building materials with reliable nationwide delivery across Nigeria.",
  email: "francisizegbune@gmail.com",
  phone: "0803 318 5040",
  phoneHref: "tel:+2348033185040",
  whatsappNumber: "2348033185040",
  address: "Rose of Sharon Plaza, Ikotun, Lagos, Nigeria",
  founder: {
    name: "Engr. Francis Izegbune",
    role: "Founder & Managing Director",
  },
} as const;

export const navLinks = [
  { label: "Home", href: "/#home" },
  { label: "About", href: "/#about" },
  { label: "Why Us", href: "/#why" },
  { label: "Products", href: "/#products" },
  { label: "Contact", href: "/#contact" },
] as const;

export function whatsappLink(message?: string) {
  const base = `https://wa.me/${siteConfig.whatsappNumber}`;
  const text =
    message ??
    "Hello IZEMS Global Resources, I would like to make an enquiry.";
  return `${base}?text=${encodeURIComponent(text)}`;
}
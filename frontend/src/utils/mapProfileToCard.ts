export type CardProfile = {
  id: string;
  fullName: string;
  gradYear?: string | number;
  titleAtCompany?: string;  // "Assistant at ABC Company Limited"
  profession?: string;      // "Mariner" - Industry/Department
  locationLabel?: string;   // "Chennai, India"
  degreeDepartment?: string;// "B.E., Marine Engineering"
  skills: string[];         // up to 4 with +N overflow
  isPrivate?: {             // Privacy settings
    [key: string]: boolean;
  };
};

export function mapProfileToCard(row: any): CardProfile {
  const fullName = row.full_name ?? `${row.first_name ?? ''} ${row.last_name ?? ''}`.trim();
  
  // Format "title at company" instead of "title @ company"
  const title = row.current_job_title ?? row.current_title ?? row.title ?? '';
  const company = row.current_company ?? row.company ?? '';
  let titleAtCompany;
  if (title && company) {
    titleAtCompany = `${title} at ${company}`;
  } else if (title) {
    titleAtCompany = title;
  } else if (company) {
    titleAtCompany = company;
  } else {
    titleAtCompany = undefined;
  }
  
  // Format location as "City, Country"
  const city = row.current_city ?? row.city ?? '';
  const country = row.current_country ?? row.country ?? '';
  let locationLabel;
  if (city && country) {
    locationLabel = `${city}, ${country}`;
  } else if (city) {
    locationLabel = city;
  } else if (country) {
    locationLabel = country;
  } else {
    locationLabel = undefined;
  }
  
  // Handle skills array properly
  const skills = Array.isArray(row.skills)
    ? row.skills
    : (typeof row.skills === 'object' && row.skills !== null && Array.isArray(row.skills?.[0]) === false)
      ? Object.values(row.skills)
      : [];
  
  // Handle privacy settings
  const isPrivate = row.is_private ?? row.isPrivate ?? {};

  return {
    id: row.id,
    fullName,
    gradYear: row.graduation_year ?? row.gradYear,
    titleAtCompany,
    profession: row.industry ?? row.department ?? row.profession ?? undefined,
    locationLabel,
    degreeDepartment: row.degree_department ?? (
      [row.degree, row.department].filter(Boolean).join(', ') || undefined
    ),
    skills: skills.map(String).filter(Boolean),
    isPrivate,
  };
}

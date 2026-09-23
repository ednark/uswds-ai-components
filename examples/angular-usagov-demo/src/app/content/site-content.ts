// Content mirrors the live https://www.usa.gov/ homepage (observed 2026-09-23).
// Links point at the real site because this demo only rebuilds the homepage.

export const USAGOV = 'https://www.usa.gov';

export interface SiteLink {
  label: string;
  href?: string;
  routerLink?: string;
  fragment?: string;
}

export interface Topic {
  title: string;
  description: string;
  href: string;
  /** USWDS sprite icon id (dist/img/sprite.svg) */
  icon: string;
}

export interface FooterColumn {
  heading: string;
  links: SiteLink[];
}

export const PRIMARY_NAV: SiteLink[] = [
  { label: 'All topics and services', routerLink: '/', fragment: 'all-topics-header' },
  { label: 'The U.S. and its government', href: `${USAGOV}/about-the-us` },
  { label: 'Government benefits', href: `${USAGOV}/benefits` },
  { label: 'Immigration and U.S. citizenship', href: `${USAGOV}/immigration-and-citizenship` },
  { label: 'Money and credit', href: `${USAGOV}/money` },
  { label: 'Travel', href: `${USAGOV}/travel` },
  { label: 'Voting and elections', href: `${USAGOV}/voting-and-elections` },
];

export const SECONDARY_NAV: SiteLink[] = [
  { label: 'Call us at 1-844-USAGOV1', href: `${USAGOV}/phone` },
  { label: 'Contact us', routerLink: '/contact' },
];

export const HOW_DO_I: SiteLink[] = [
  { label: 'Check my voter registration', href: `${USAGOV}/confirm-voter-registration` },
  { label: 'Get or renew a passport', href: `${USAGOV}/passport` },
  { label: 'Get housing help', href: `${USAGOV}/housing-help` },
  { label: 'Find unclaimed money', href: `${USAGOV}/unclaimed-money` },
];

export const TOPICS: Topic[] = [
  {
    title: 'Voting and elections',
    icon: 'campaign',
    href: `${USAGOV}/voting-and-elections`,
    description:
      'Find out how to register to vote, where your voting location is, how presidential elections work, and more about voting in the United States.',
  },
  {
    title: 'The U.S. and its government',
    icon: 'flag',
    href: `${USAGOV}/about-the-us`,
    description:
      'Learn about U.S. laws, history, and more. Buy government property. Contact elected officials and federal agencies.',
  },
  {
    title: 'Complaints',
    icon: 'report',
    href: `${USAGOV}/complaints`,
    description:
      'File complaints involving government agencies, telemarketers, products and services, travel, housing, and banking.',
  },
  {
    title: 'Disability services',
    icon: 'accessible_forward',
    href: `${USAGOV}/disability-services`,
    description:
      'Find government benefits and programs for people with disabilities and their families.',
  },
  {
    title: 'Disasters and emergencies',
    icon: 'hurricane',
    href: `${USAGOV}/disasters-and-emergencies`,
    description:
      'Learn about disaster assistance and find government benefits for other emergencies.',
  },
  {
    title: 'Education',
    icon: 'school',
    href: `${USAGOV}/education`,
    description:
      'Learn about Federal Student Aid and studying in the U.S. Find early intervention, special education, and Head Start programs.',
  },
  {
    title: 'Government benefits',
    icon: 'account_balance',
    href: `${USAGOV}/benefits`,
    description:
      'Find government programs that may help pay for food, housing, health care, and more.',
  },
  {
    title: 'Health',
    icon: 'medical_services',
    href: `${USAGOV}/health`,
    description:
      'Get information about health insurance. Find help for mental health and other medical conditions, testing, and paying medical bills.',
  },
  {
    title: 'Housing help',
    icon: 'home',
    href: `${USAGOV}/housing-help`,
    description:
      'Learn about rental and buyer assistance programs. Find emergency housing and avoid eviction.',
  },
  {
    title: 'Immigration and U.S. citizenship',
    icon: 'public',
    href: `${USAGOV}/immigration-and-citizenship`,
    description:
      'Learn about U.S. residency, Green Cards, citizenship requirements, and related issues.',
  },
  {
    title: 'Innovation',
    icon: 'lightbulb',
    href: `${USAGOV}/innovation`,
    description:
      'Find ways you can participate through citizen science projects and challenges. Explore active competitions and volunteer opportunities. Innovation is essential to solving problems.',
  },
  {
    title: 'Jobs, labor laws, and unemployment',
    icon: 'work',
    href: `${USAGOV}/jobs-labor-laws-unemployment`,
    description:
      'Get resources for finding a job. Learn about unemployment insurance and important labor laws.',
  },
  {
    title: 'Laws and legal issues',
    icon: 'local_library',
    href: `${USAGOV}/laws-and-legal-issues`,
    description:
      'Learn how to replace vital records, get child support enforcement, find legal help, and more.',
  },
  {
    title: 'Military and veterans',
    icon: 'military_tech',
    href: `${USAGOV}/military-and-veterans`,
    description:
      'Learn how to join the military. Find benefits and services as a member or veteran, including how to apply for housing, financial, health, and other support.',
  },
  {
    title: 'Money and credit',
    icon: 'attach_money',
    href: `${USAGOV}/money`,
    description:
      'Find government grants, loans, and unclaimed money. Learn about taxes. Get credit reports and scores.',
  },
  {
    title: 'Scams and fraud',
    icon: 'security',
    href: `${USAGOV}/scams-and-fraud`,
    description:
      'Learn about identity theft, Social Security scams, and how to report scams and fraud.',
  },
  {
    title: 'Small business',
    icon: 'store',
    href: `${USAGOV}/small-business`,
    description:
      'Learn how to start, fund, and manage your own business. Understand how to get import and export licenses.',
  },
  {
    title: 'Taxes',
    icon: 'assessment',
    href: `${USAGOV}/taxes`,
    description:
      'Learn about filing federal income tax. Find out how to pay, how to check your refund, and more.',
  },
  {
    title: 'Travel',
    icon: 'flight',
    href: `${USAGOV}/travel`,
    description:
      'Learn about passports, travel documents for minors, and travel to, from, and within the U.S.',
  },
  {
    title: 'Life events',
    icon: 'groups',
    href: `${USAGOV}/life-events`,
    description:
      'Discover government benefits and services to help you and your family through every stage of life.',
  },
];

export const FOOTER_COLUMNS: FooterColumn[] = [
  {
    heading: 'Government information',
    links: [
      { label: 'All topics and services', routerLink: '/', fragment: 'all-topics-header' },
      { label: 'Directory of U.S. government agencies and departments', href: `${USAGOV}/agency-index` },
      { label: 'Branches of government', href: `${USAGOV}/branches-of-government` },
    ],
  },
  {
    heading: 'About us',
    links: [
      { label: 'About USAGov', href: `${USAGOV}/about` },
      { label: 'Contact us', routerLink: '/contact' },
      { label: 'Report a website issue', href: `${USAGOV}/site-issue-report-form` },
      { label: 'Website usage data', href: `${USAGOV}/website-analytics/` },
    ],
  },
  {
    heading: 'For federal agencies',
    links: [
      { label: 'Partner with us', href: `${USAGOV}/partner-with-usagov` },
      { label: 'Read our blog', href: `${USAGOV}/blog` },
    ],
  },
];

export const REQUIRED_LINKS: SiteLink[] = [
  { label: 'Accessibility policy', href: `${USAGOV}/accessibility-policy` },
  { label: 'Privacy and security policies', href: `${USAGOV}/privacy-security` },
  { label: 'FOIA requests', href: 'https://www.gsa.gov/reference/freedom-of-information-act-foia' },
];

export const CONTACT_TOPICS: { value: string; label: string }[] = [
  { value: 'benefits', label: 'Government benefits' },
  { value: 'passports', label: 'Passports and travel' },
  { value: 'taxes', label: 'Taxes' },
  { value: 'voting', label: 'Voting and elections' },
  { value: 'website', label: 'Problem with this website' },
  { value: 'other', label: 'Something else' },
];

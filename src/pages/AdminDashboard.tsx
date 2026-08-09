import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSectionInstances } from '@/hooks/useSectionInstances';
import { useScopedSectionInstances, type ScopedPageSection } from '@/hooks/useScopedSectionInstances';
import { toast } from 'sonner';
import ImageUpload from '@/components/admin/ImageUpload';
import CKEditor from '@/components/admin/CKEditor';
import { Switch } from '@/components/ui/switch';
import { buildFaqTree, type FAQRecord } from '@/lib/faqUtils';
import {
  getComparisonPlanVisibilityMap,
  setComparisonPlanVisibility,
} from '@/lib/getListedComparisonVisibility';
import { resolveSubcategorySortOrder } from '@/lib/subcategoryOrdering';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  GripVertical, Plus, Pencil, Trash2, LogOut, Home, X, Save,
  LayoutDashboard, Type, Layers, CreditCard, Tag, Star, Image, Lock, Unlock, ArrowLeft, CheckCircle2, ChevronDown, Mail, PenTool
} from 'lucide-react';

interface PageSection { id: string; section_type: string; name: string; sort_order: number; is_visible: boolean; is_locked: boolean; heading: string; description: string | null; show_heading: boolean; background_color?: string | null; }
interface FeaturedCard { id: string; title: string; description: string; logo_url: string | null; link: string | null; sort_order: number; section_id: string; is_fixed: boolean; show_border: boolean; border_color: string | null; background_color?: string | null; is_visible: boolean; open_in_new_tab: boolean; }
interface Category { id: string; name: string; icon_url?: string | null; video_url?: string; image_url?: string; bg_color: string; sort_order: number; section_id: string; show_brands_tab?: boolean; is_visible?: boolean; }
interface Subcategory {
  id: string;
  category_id: string;
  name: string;
  link: string | null;
  is_visible?: boolean;
  custom_link?: string | null;
  custom_link_type?: 'link' | 'iframe' | null;
  video_url?: string | null;
  video_url_2?: string[] | null;
  schedule_link?: string | null;
  schedule_link_2?: string | null;
  show_schedule_2_in_separate_tab?: boolean;
  show_schedule_in_separate_tab?: boolean;
  form_link?: string | null;
  show_form_in_separate_tab?: boolean;
  about_heading?: string | null;
  about_content?: string | null;
  overview_points_heading?: string | null;
  detail_heading?: string | null;
  detail_description?: string | null;
  show_brands?: boolean;
  show_about_section?: boolean;
  show_header_points_section?: boolean;
  sort_order: number;
  about_subheading?: string | null;
  image_url?: string | null;
  brands_tab_label?: string | null;
  key_features_tab_label?: string | null;
  hero_background_color?: string | null;
  tab_order?: string[] | null;
  about_bg_color?: string | null;
  about_heading_color?: string | null;
  about_subheading_color?: string | null;
  about_description_color?: string | null;
  about_button_bg_color?: string | null;
  about_button_text_color?: string | null;
  button_1_text?: string | null;
  button_1_link?: string | null;
  button_1_visible?: boolean;
  button_2_text?: string | null;
  button_2_link?: string | null;
  button_2_visible?: boolean;
  button_3_text?: string | null;
  button_3_link?: string | null;
  button_3_visible?: boolean;
}
interface CategoryButton { id?: string; subcategory_id?: string; label: string; link: string | null; is_visible: boolean; sort_order?: number; }
interface BrandActionLinkItem {
  id?: string;
  text?: string | null;
  url?: string | null;
  new_tab?: boolean;
  enabled?: boolean;
}

interface SubcategoryBrand {
  id?: string;
  name: string;
  logo_url: string | null;
  link: string | null;
  description?: string | null;
  buttons?: CategoryButton[];
  is_visible: boolean;
  action_links?: BrandActionLinkItem[];
  action_link_1_text?: string | null;
  action_link_1_url?: string | null;
  action_link_1_new_tab?: boolean;
  action_link_1_enabled?: boolean;
  action_link_2_text?: string | null;
  action_link_2_url?: string | null;
  action_link_2_new_tab?: boolean;
  action_link_2_enabled?: boolean;
  action_link_3_text?: string | null;
  action_link_3_url?: string | null;
  action_link_3_new_tab?: boolean;
  action_link_3_enabled?: boolean;
  primary_cta_label?: string | null;
  primary_cta_link?: string | null;
  primary_cta_visible?: boolean;
  more_actions_label?: string | null;
  more_actions_visible?: boolean;
  join_network_label?: string | null;
  join_network_link?: string | null;
  join_network_visible?: boolean;
}
interface SubcategoryOverviewPoint { id?: string; subcategory_id: string; section_id?: string; text: string; is_highlighted: boolean; highlight_color?: 'green' | 'blue'; sort_order: number; }
interface SubcategoryKeyFeaturesSection { id: string; subcategory_id: string; heading: string; is_visible: boolean; sort_order: number; }
interface SubcategoryAboutSection { id: string; subcategory_id: string; heading: string; content: string | null; background_color?: string; heading_color?: string; sort_order: number; created_at: string; updated_at: string; }
interface Offer { id: string; image_url: string | null; heading: string; description: string | null; link: string | null; sort_order: number; section_id: string; is_fixed: boolean; show_border: boolean; border_color: string | null; background_color: string | null; show_image: boolean; is_visible: boolean; open_in_new_tab: boolean; }
interface Ad2 { id: string; image_url: string | null; link: string | null; sort_order: number; section_id: string; is_fixed: boolean; show_border: boolean; border_color: string | null; background_color: string | null; show_image: boolean; is_visible: boolean; open_in_new_tab: boolean; }
interface Ad3 { id: string; image_url: string | null; heading: string | null; description: string | null; link: string | null; sort_order: number; section_id: string; is_fixed: boolean; show_border: boolean; border_color: string | null; background_color: string | null; show_image: boolean; is_visible: boolean; open_in_new_tab: boolean; }

function normalizeAdminBrandActionLinks(brand: Partial<SubcategoryBrand> & Record<string, any>): BrandActionLinkItem[] {
  const configuredLinks = Array.isArray((brand as any).action_links)
    ? (brand as any).action_links
      .map((link: BrandActionLinkItem | null | undefined) => ({
        id: link?.id,
        text: link?.text?.trim() || null,
        url: link?.url?.trim() || null,
        new_tab: Boolean(link?.new_tab),
        enabled: link?.enabled ?? true,
      }))
      .filter((link) => Boolean(link.text || link.url || link.enabled !== undefined))
    : [];

  if (configuredLinks.length > 0) {
    return configuredLinks;
  }

  const legacyLinks = [
    {
      text: brand.action_link_1_text,
      url: brand.action_link_1_url,
      new_tab: brand.action_link_1_new_tab,
      enabled: brand.action_link_1_enabled,
    },
    {
      text: brand.action_link_2_text,
      url: brand.action_link_2_url,
      new_tab: brand.action_link_2_new_tab,
      enabled: brand.action_link_2_enabled,
    },
    {
      text: brand.action_link_3_text,
      url: brand.action_link_3_url,
      new_tab: brand.action_link_3_new_tab,
      enabled: brand.action_link_3_enabled,
    },
  ].filter((link) => Boolean(link.text || link.url || link.enabled !== undefined));

  return legacyLinks.map((link, index) => ({
    id: `legacy-${index}`,
    text: link.text,
    url: link.url,
    new_tab: Boolean(link.new_tab),
    enabled: link.enabled ?? true,
  }));
}

function buildBrandActionLinkPayload(actionLinks: BrandActionLinkItem[] | undefined) {
  return (actionLinks || [])
    .map((link) => ({
      id: link.id,
      text: link.text?.trim() || null,
      url: link.url?.trim() || null,
      new_tab: Boolean(link.new_tab),
      enabled: link.enabled ?? true,
    }))
    .filter((link) => Boolean(link.text || link.url));
}

function extractMissingColumnsFromError(errorMessage: string) {
  const missingColumns = new Set<string>();
  const patterns = [
    /column "([^"]+)" of relation "[^"]+" does not exist/gi,
    /could not find column "([^"]+)"/gi,
    /Could not find the column named "([^"]+)"/gi,
    /column "([^"]+)" does not exist/gi,
    /relation "[^"]+" does not exist/gi,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(errorMessage))) {
      if (match[1]) missingColumns.add(match[1]);
    }
  }

  return missingColumns;
}

function stripColumnsFromPayload<T extends Record<string, any>>(items: T[], columns: Set<string>) {
  if (columns.size === 0) return items;
  return items.map((item) => {
    const filtered = { ...item };
    columns.forEach((column) => delete filtered[column]);
    return filtered;
  });
}

async function upsertWithMissingColumnFallback<T extends Record<string, any>>(table: string, rows: T[]) {
  let payload = rows;
  const removedColumns = new Set<string>();

  while (true) {
    const { error } = await supabase.from(table as any).upsert(payload as any);
    if (!error) return;

    const errorMessage = (error as any)?.message || JSON.stringify(error);
    const missingColumns = extractMissingColumnsFromError(errorMessage);
    const newColumns = [...missingColumns].filter((column) => !removedColumns.has(column));

    if (newColumns.length === 0) {
      throw error;
    }

    newColumns.forEach((column) => removedColumns.add(column));
    payload = stripColumnsFromPayload(rows, removedColumns);

    if (payload.length === 0) {
      throw error;
    }
  }
}

async function insertWithMissingColumnFallback<T extends Record<string, any>>(table: string, rows: T[]) {
  let payload = rows;
  const removedColumns = new Set<string>();

  while (true) {
    const { error } = await supabase.from(table as any).insert(payload as any);
    if (!error) return;

    const errorMessage = (error as any)?.message || JSON.stringify(error);
    const missingColumns = extractMissingColumnsFromError(errorMessage);
    const newColumns = [...missingColumns].filter((column) => !removedColumns.has(column));

    if (newColumns.length === 0) {
      throw error;
    }

    newColumns.forEach((column) => removedColumns.add(column));
    payload = stripColumnsFromPayload(rows, removedColumns);

    if (payload.length === 0) {
      throw error;
    }
  }
}

interface LegalPage { id: string; slug: string; title: string; content: string | null; is_visible?: boolean; }
interface AdvertiseSettings {
  id?: string;
  hero_small_heading: string;
  hero_main_heading: string;
  hero_description: string;
  hero_button_text?: string | null;
  hero_button_link?: string | null;
  hero_button_visible: boolean;
  hero_image_url?: string | null;
  hero_image_visible: boolean;
  hero_visible: boolean;
  marketing_cards_main_heading: string;
  marketing_cards_subheading: string;
  section3_small_heading: string;
  section3_main_heading: string;
  section3_description: string;
  section3_image_url?: string | null;
  section3_background_color?: string | null;
  section3_visible: boolean;
  section4_small_heading: string;
  section4_main_heading: string;
  section4_description: string;
  section4_button_text?: string | null;
  section4_button_link?: string | null;
  section4_image_url?: string | null;
  section4_visible: boolean;
  dynamic_sections_heading_part1: string;
  dynamic_sections_heading_part2: string;
}
interface AdvertiseCard {
  id: string;
  logo_url?: string | null;
  heading: string;
  description: string;
  sort_order: number;
  is_visible: boolean;
}
interface AdvertiseSection {
  id: string;
  small_heading: string;
  main_heading: string;
  description: string;
  button_text?: string | null;
  button_link?: string | null;
  button_visible: boolean;
  image_url?: string | null;
  sort_order: number;
  is_visible: boolean;
}

interface WriteForUsSettings {
  id?: string;
  heading: string;
  banner_image_url?: string | null;
  content: string;
  contact_email: string;
  contact_intro_text: string;
}

interface VendorGuidelinesSettings {
  id?: string;
  heading: string;
  content: string;
  contact_email: string;
  contact_intro_text: string;
}

interface BrowseAllDirectoriesSettings {
  id?: string;
  heading: string;
}

interface GetListedPlan {
  id?: string;
  plan_name: string;
  comparison_header?: string | null;
  price_inr: number;
  price_usd: number;
  duration: string;
  button_text?: string | null;
  button_link?: string | null;
  button_link_usd?: string | null;
  button_visible: boolean;
  popular: boolean;
  visible: boolean;
  show_view_more: boolean;
  sort_order: number;
}

interface GetListedPlanFeature {
  id?: string;
  plan_id: string;
  feature_text: string;
  visible?: boolean;
  sort_order: number;
}

interface GetListedComparisonRow {
  id?: string;
  row_title: string;
  visible: boolean;
  sort_order: number;
}

interface GetListedComparisonCell {
  id?: string;
  row_id: string;
  plan_id: string;
  tick_enabled: boolean;
  custom_text?: string | null;
}
interface GetListedSettings {
  id?: string;
  main_heading: string;
  comparison_heading: string;
  comparison_footer_content: string;
  comparison_footer_line: string;
  show_currency_toggle?: boolean;
  show_pricing_section?: boolean;
  show_comparison_section?: boolean;
  show_comparison_footer?: boolean;
}
interface HeaderSettings {
  id?: string;
  leave_review_text: string;
  leave_review_link: string;
  leave_review_visible: boolean;
  for_providers_text: string;
  for_providers_link: string;
  for_providers_visible: boolean;
  sign_in_link: string;
  sign_in_text: string;
  sign_in_visible: boolean;
  join_text: string;
  join_link: string;
  join_visible: boolean;
  submit_button_text: string;
  submit_button_link: string;
  submit_button_visible: boolean;
}

interface FooterSettings {
  id?: string;
  description: string;
  description_visible?: boolean;
  twitter_label: string;
  twitter_link: string;
  twitter_visible?: boolean;
  linkedin_label: string;
  linkedin_link: string;
  linkedin_visible?: boolean;
  facebook_label: string;
  facebook_link: string;
  facebook_visible?: boolean;
  instagram_label: string;
  instagram_link: string;
  instagram_visible?: boolean;
  youtube_label: string;
  youtube_link: string;
  youtube_visible?: boolean;
  social_whatsapp_visible?: boolean;
  social_media_visible?: boolean;
  about_us_visible?: boolean;
  contact_visible?: boolean;
  privacy_policy_visible?: boolean;
  terms_of_service_visible?: boolean;
  refund_policy_visible?: boolean;
  refund_policy_1_visible?: boolean;
  refund_policy_2_visible?: boolean;
  refund_policy_3_visible?: boolean;
  refund_policy_4_visible?: boolean;
  faq_visible?: boolean;
  faq_heading?: string;
  whatsapp_number?: string;
  whatsapp_visible?: boolean;
  phone?: string;
  phone_visible?: boolean;
  email?: string;
  email_visible?: boolean;
  bottom_footer_email?: string;
  bottom_footer_email_visible?: boolean;
  bottom_branding_visible?: boolean;
  bottom_branding_text?: string;
  submit_rft_label?: string;
  submit_rft_url?: string;
  submit_rft_enabled?: boolean;
  get_recommendations_label?: string;
  get_recommendations_url?: string;
  get_recommendations_enabled?: boolean;
  get_listed_visible?: boolean;
  advertise_visible?: boolean;
  write_for_us_visible?: boolean;
  vendor_guidelines_visible?: boolean;
  view_all_categories_visible?: boolean;
  vendors_visible?: boolean;
  buyers_visible?: boolean;
}

// Product Tab Sections types and constants
const PRODUCT_SECTION_TABLE = 'subcategory_page_sections';
const PRODUCT_CARDS_TABLE = 'subcategory_featured_cards';
const PRODUCT_OFFERS_TABLE = 'subcategory_offers';
const PRODUCT_ADS_2_TABLE = 'subcategory_ads_2col';
const PRODUCT_ADS_3_TABLE = 'subcategory_ads_3col';

type ProductAdminTab = 'layout' | 'cards' | 'offers' | 'ads_1col' | 'ads_2col' | 'ads_3col';

const PRODUCT_ADMIN_TABS: { key: ProductAdminTab; label: string; icon: React.ReactNode }[] = [
  { key: 'layout', label: 'Sections', icon: <Layers className="h-4 w-4" /> },
  { key: 'cards', label: 'Feature Cards', icon: <CreditCard className="h-4 w-4" /> },
  { key: 'offers', label: 'Offers', icon: <Star className="h-4 w-4" /> },
  { key: 'ads_1col', label: 'Ad 1', icon: <Image className="h-4 w-4" /> },
  { key: 'ads_2col', label: 'Ad 2', icon: <Image className="h-4 w-4" /> },
  { key: 'ads_3col', label: 'Ad 3', icon: <Image className="h-4 w-4" /> },
];

const PRODUCT_SECTION_TYPE_OPTIONS = [
  { value: 'cards', label: 'Feature Cards' },
  { value: 'offers', label: 'Offers' },
  { value: 'ads_1col', label: 'Ad 1' },
  { value: 'ads_2col', label: 'Ad 2' },
  { value: 'ads_3col', label: 'Ad 3' },
];

interface FeaturedCardItem {
  id: string;
  title: string;
  description: string;
  logo_url: string | null;
  link: string | null;
  sort_order: number;
  section_id: string;
  is_fixed: boolean;
  show_border: boolean;
  border_color: string | null;
  background_color?: string | null;
  is_visible: boolean;
  open_in_new_tab: boolean;
}

interface OfferItem {
  id: string;
  image_url: string | null;
  heading: string;
  description: string | null;
  link: string | null;
  sort_order: number;
  section_id: string;
  is_fixed: boolean;
  show_border: boolean;
  border_color: string | null;
  background_color: string | null;
  show_image: boolean;
  is_visible: boolean;
  open_in_new_tab: boolean;
}

interface Ad2Item {
  id: string;
  image_url: string | null;
  link: string | null;
  sort_order: number;
  section_id: string;
  is_fixed: boolean;
  show_border: boolean;
  border_color: string | null;
  background_color: string | null;
  show_image: boolean;
  is_visible: boolean;
  open_in_new_tab: boolean;
}

interface Ad3Item extends Ad2Item {
  heading: string | null;
  description: string | null;
  background_color: string | null;
}

interface FAQ extends FAQRecord { }

type Tab = 'dashboard' | 'hero' | 'header' | 'sections' | 'cards' | 'categories' | 'offers' | 'ads_1col' | 'ads_2col' | 'ads_3col' | 'footer' | 'footer_general' | 'footer_contact' | 'footer_subscribers' | 'footer_privacy' | 'footer_terms' | 'footer_about' | 'footer_refund' | 'footer_refund_1' | 'footer_refund_2' | 'footer_refund_3' | 'footer_refund_4' | 'faqs' | 'advertise' | 'get-listed' | 'write-for-us' | 'vendor-guidelines' | 'browse-all-directories';


function SortableItem({ id, children, disabled }: { id: string; children: React.ReactNode; disabled?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id, disabled });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-3 p-3 bg-card rounded-lg border border-border mb-2">
      <button
        {...(disabled ? {} : { ...attributes, ...listeners })}
        type="button"
        className={`text-muted-foreground ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-grab hover:text-foreground'}`}
        aria-label={disabled ? 'Fixed section' : 'Drag to reorder section'}
      >
        {disabled ? <Lock className="w-5 h-5" /> : <GripVertical className="w-5 h-5" />}
      </button>
      <div className="flex-1">{children}</div>
    </div>
  );
}

// Custom sortable item for About sections that isolates the RichTextEditor from drag operations
function SortableAboutSectionItem({ id, children, disabled }: { id: string; children: React.ReactNode; disabled?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id, disabled });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <div ref={setNodeRef} style={style} className="w-full space-y-3">
      <div className="flex items-center gap-3">
        <button
          {...(disabled ? {} : { ...attributes, ...listeners })}
          type="button"
          className={`text-muted-foreground ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-grab hover:text-foreground'}`}
          aria-label={disabled ? 'Fixed section' : 'Drag to reorder section'}
        >
          {disabled ? <Lock className="w-5 h-5" /> : <GripVertical className="w-5 h-5" />}
        </button>
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}

function SortableOfferItem({ id, children, disabled }: { id: string; children: React.ReactNode; disabled?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id, disabled });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border">
      <button
        {...(disabled ? {} : { ...attributes, ...listeners })}
        type="button"
        className={`text-muted-foreground ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-grab hover:text-foreground'}`}
        aria-label={disabled ? 'Fixed mode disabled' : 'Drag to reorder offer'}
      >
        {disabled ? <Lock className="w-4 h-4" /> : <GripVertical className="w-4 h-4" />}
      </button>
      {children}
    </div>
  );
}

function SortableCategoryItem({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border">
      <button
        {...attributes}
        {...listeners}
        type="button"
        className="text-muted-foreground cursor-grab hover:text-foreground"
        aria-label="Drag to reorder category"
      >
        <GripVertical className="w-4 h-4" />
      </button>
      {children}
    </div>
  );
}

function SortableAdminItem({
  id,
  children,
  disabled = false,
  className = '',
}: {
  id: string;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id, disabled });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-3 rounded-xl border border-border bg-card p-4 justify-start ${className}`}
    >
      <button
        type="button"
        {...(disabled ? {} : { ...attributes, ...listeners })}
        className={`text-muted-foreground ${disabled ? 'cursor-not-allowed opacity-40' : 'cursor-grab hover:text-foreground'}`}
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-3" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-card p-5 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="pr-2 text-lg font-bold">{title}</h3>
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

interface SidebarItem {
  key: Tab;
  label: string;
  icon: React.ReactNode;
  children?: { key: Tab; label: string }[];
}

const SIDEBAR_ITEMS: SidebarItem[] = [
  { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { key: 'hero', label: 'Hero Section', icon: <Type className="w-5 h-5" /> },
  { key: 'header', label: 'Header Options', icon: <Layers className="w-5 h-5" /> },
  { key: 'sections', label: 'Page Layout', icon: <Layers className="w-5 h-5" /> },
  { key: 'cards', label: 'Feature Cards', icon: <CreditCard className="w-5 h-5" /> },
  { key: 'categories', label: 'Categories', icon: <Tag className="w-5 h-5" /> },
  { key: 'offers', label: 'Offers', icon: <Star className="w-5 h-5" /> },
  { key: 'ads_1col', label: '1-Col Ad', icon: <Image className="w-5 h-5" /> },
  { key: 'ads_2col', label: '2-Col Ads', icon: <Image className="w-5 h-5" /> },
  { key: 'ads_3col', label: '3-Col Ads', icon: <Image className="w-5 h-5" /> },
  {
    key: 'footer',
    label: 'Footer Options',
    icon: <Home className="w-5 h-5" />,
    children: [
      { key: 'advertise', label: 'Advertise Page' },
      { key: 'get-listed', label: 'Get Listed' },
      { key: 'write-for-us', label: 'Write For Us' },
      { key: 'vendor-guidelines', label: 'Vendor Guidelines' },
      { key: 'browse-all-directories', label: 'Browse All Directories' },
      { key: 'footer_about', label: 'About Us' },
      { key: 'footer_contact', label: 'Contact Page' },
      { key: 'footer_general', label: 'General Settings' },
      { key: 'footer_subscribers', label: 'Subscribers' },
      { key: 'footer_privacy', label: 'Privacy Policy' },
      { key: 'footer', label: 'Social Media Links' },
      { key: 'footer_terms', label: 'Terms of Service' },
      { key: 'footer_refund', label: 'Refund Policy' },
      { key: 'footer_refund_1', label: 'Refund Policy 1' },
      { key: 'footer_refund_2', label: 'Refund Policy 2' },
      { key: 'footer_refund_3', label: 'Refund Policy 3' },
      { key: 'footer_refund_4', label: 'Refund Policy 4' },
      { key: 'faqs', label: 'FAQs' },
    ]
  },
];



export default function AdminDashboard() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedSidebarItem, setExpandedSidebarItem] = useState<string | null>(null);

  // Use the new section instances hook
  const {
    sections: sectionsFromHook,
    addSection,
    deleteSection,
    toggleVisibility,
    toggleLockState,
    updateSectionName,
    updateSortOrder,
    updateHeading,
    toggleShowHeading,
  } = useSectionInstances();

  const [sections, setSections] = useState<PageSection[]>([]);
  const [heroTextPart1, setHeroTextPart1] = useState('');
  const [heroTextPart2, setHeroTextPart2] = useState('');
  const [heroWords, setHeroWords] = useState<string[]>([]);
  const [heroVisible, setHeroVisible] = useState(true);
  const [heroTextPart1Visible, setHeroTextPart1Visible] = useState(true);
  const [heroTextPart2Visible, setHeroTextPart2Visible] = useState(true);
  const [heroAnimatedWordsVisible, setHeroAnimatedWordsVisible] = useState(true);
  const [heroSearchVisible, setHeroSearchVisible] = useState(true);
  const [heroAnimatedWordVisibility, setHeroAnimatedWordVisibility] = useState<boolean[]>([]);
  const [cards, setCards] = useState<FeaturedCard[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [ads2, setAds2] = useState<Ad2[]>([]);
  const [ads3, setAds3] = useState<Ad3[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const faqTree = buildFaqTree(faqs, { includeHidden: true });
  const [buttons, setButtons] = useState<CategoryButton[]>([]);
  const [subcategoriesMap, setSubcategoriesMap] = useState<Record<string, string>>({});
  const [activeAccordion, setActiveAccordion] = useState<string | null>(null);

  interface ContactEmail {
    label: string;
    email: string;
  }

  const [contactSettings, setContactSettings] = useState({
    id: undefined as string | undefined,
    heading: '',
    email_label: '',
    email: '',
    description_1: '',
    description_2: '',
    image_url: '',
    phone: '',
    whatsapp: '',
    address: '',
    form_embed: '',
    contact_emails: [] as ContactEmail[],
    nodal_officer_title: '',
    nodal_officer_name: '',
    nodal_officer_phone: '',
    nodal_officer_email: '',
    nodal_officer_visible: true,
    appellate_authority_title: '',
    appellate_authority_name: '',
    appellate_authority_phone: '',
    appellate_authority_email: '',
    appellate_authority_visible: true,
    is_visible: true,
  });
  const [headerSettings, setHeaderSettings] = useState<HeaderSettings>({
    leave_review_text: 'Leave a Review',
    leave_review_link: '#',
    leave_review_visible: true,
    for_providers_text: 'For Providers',
    for_providers_link: '#',
    for_providers_visible: true,
    sign_in_text: 'Sign In',
    sign_in_link: '#',
    sign_in_visible: true,
    join_text: 'Join',
    join_link: '#',
    join_visible: true,
    submit_button_text: 'Submit',
    submit_button_link: '#',
    submit_button_visible: true,
  });
  const [footerSettings, setFooterSettings] = useState<FooterSettings>({
    description: '',
    description_visible: true,
    twitter_label: 'Twitter',
    twitter_link: '#',
    twitter_visible: true,
    linkedin_label: 'LinkedIn',
    linkedin_link: '#',
    linkedin_visible: true,
    facebook_label: 'Facebook',
    facebook_link: '#',
    facebook_visible: true,
    instagram_label: 'Instagram',
    instagram_link: '#',
    instagram_visible: false,
    youtube_label: 'YouTube',
    youtube_link: '#',
    youtube_visible: false,
    social_whatsapp_visible: false,
    social_media_visible: true,
    about_us_visible: true,
    contact_visible: true,
    privacy_policy_visible: true,
    terms_of_service_visible: true,
    refund_policy_visible: true,
    refund_policy_1_visible: true,
    refund_policy_2_visible: true,
    refund_policy_3_visible: true,
    refund_policy_4_visible: true,
    faq_visible: true,
    faq_heading: 'Frequently Asked Questions',
    whatsapp_number: '',
    whatsapp_visible: false,
    phone: '',
    phone_visible: false,
    email: '',
    email_visible: false,
    bottom_footer_email: '',
    bottom_footer_email_visible: false,
    bottom_branding_visible: true,
    bottom_branding_text: '',
    submit_rft_label: 'Submit RFT',
    submit_rft_url: '',
    submit_rft_enabled: false,
    get_recommendations_label: 'Get Recommendations',
    get_recommendations_url: '',
    get_recommendations_enabled: false,
    get_listed_visible: true,
    advertise_visible: true,
    write_for_us_visible: true,
    vendor_guidelines_visible: true,
    view_all_categories_visible: true,
    vendors_visible: true,
    buyers_visible: true,
  });
  const [footerSubscribers, setFooterSubscribers] = useState<Array<{ id: string; email: string; created_at: string }>>([]);
  const [isLoadingContactSettings, setIsLoadingContactSettings] = useState(true);
  const [isSavingContact, setIsSavingContact] = useState(false);
  const [isSavingFooter, setIsSavingFooter] = useState(false);
  const [isSavingHeader, setIsSavingHeader] = useState(false);
  const [legalPages, setLegalPages] = useState<LegalPage[]>([]);
  const [isSavingLegal, setIsSavingLegal] = useState(false);
  const [editableLegalTitles, setEditableLegalTitles] = useState<Record<string, string>>({});
  const [editableLegalVisibility, setEditableLegalVisibility] = useState<Record<string, boolean>>({});

  // Advertise Page States
  const [advertiseSettings, setAdvertiseSettings] = useState<AdvertiseSettings>({
    hero_small_heading: '',
    hero_main_heading: '',
    hero_description: '',
    hero_button_text: '',
    hero_button_link: '',
    hero_button_visible: true,
    hero_image_url: '',
    hero_image_visible: true,
    hero_visible: true,
    marketing_cards_main_heading: 'Marketing Strategies',
    marketing_cards_subheading: 'that can do wonders for your business',
    section3_small_heading: '',
    section3_main_heading: '',
    section3_description: '',
    section3_image_url: '',
    section3_background_color: '',
    section3_visible: true,
    section4_small_heading: '',
    section4_main_heading: '',
    section4_description: '',
    section4_button_text: '',
    section4_button_link: '',
    section4_image_url: '',
    section4_visible: true,
    dynamic_sections_heading_part1: '',
    dynamic_sections_heading_part2: '',
  });
  const [advertiseCards, setAdvertiseCards] = useState<AdvertiseCard[]>([]);
  const [advertiseSections, setAdvertiseSections] = useState<AdvertiseSection[]>([]);
  const [showAddAdvertiseCardModal, setShowAddAdvertiseCardModal] = useState(false);
  const [showAddAdvertiseSectionModal, setShowAddAdvertiseSectionModal] = useState(false);
  const [editAdvertiseCard, setEditAdvertiseCard] = useState<Partial<AdvertiseCard> | null>(null);
  const [editAdvertiseSection, setEditAdvertiseSection] = useState<Partial<AdvertiseSection> | null>(null);

  // Get Listed Page States
  const [getListedPlans, setGetListedPlans] = useState<GetListedPlan[]>([]);
  const [getListedPlanFeatures, setGetListedPlanFeatures] = useState<GetListedPlanFeature[]>([]);
  const [getListedComparisonRows, setGetListedComparisonRows] = useState<GetListedComparisonRow[]>([]);
  const [getListedComparisonCells, setGetListedComparisonCells] = useState<GetListedComparisonCell[]>([]);
  const [getListedSettings, setGetListedSettings] = useState<GetListedSettings>({
    id: undefined,
    main_heading: 'Choose the best plan for your business.',
    comparison_heading: 'Detailed pricing',
    comparison_footer_content: '',
    comparison_footer_line: '',
    show_currency_toggle: true,
    show_pricing_section: true,
    show_comparison_section: true,
    show_comparison_footer: true
  });
  const [writeForUsSettings, setWriteForUsSettings] = useState<WriteForUsSettings>({
    id: '',
    heading: 'Write For Us',
    banner_image_url: '',
    content: '',
    contact_email: 'email@example.com',
    contact_intro_text: 'Or else you connect with us at'
  });
  const [vendorGuidelinesSettings, setVendorGuidelinesSettings] = useState<VendorGuidelinesSettings>({
    id: '',
    heading: 'Vendor Guidelines',
    content: '',
    contact_email: 'email@example.com',
    contact_intro_text: 'Or else you connect with us at'
  });
  const [browseAllDirectoriesSettings, setBrowseAllDirectoriesSettings] = useState<BrowseAllDirectoriesSettings>({
    id: '',
    heading: 'All Directories & Reviews'
  });
  const [showAddGetListedPlanModal, setShowAddGetListedPlanModal] = useState(false);
  const [showAddGetListedComparisonRowModal, setShowAddGetListedComparisonRowModal] = useState(false);
  const [editGetListedPlan, setEditGetListedPlan] = useState<Partial<GetListedPlan> | null>(null);
  const [editGetListedComparisonRow, setEditGetListedComparisonRow] = useState<Partial<GetListedComparisonRow> | null>(null);
  const [getListedSelectedPlanId, setGetListedSelectedPlanId] = useState<string | null>(null);
  const [cellInputValues, setCellInputValues] = useState<Record<string, string>>({}); // key: `${rowId}-${planId}`
  const [editingGetListedFeatureId, setEditingGetListedFeatureId] = useState<string | null>(null);
  const [editingGetListedFeatureText, setEditingGetListedFeatureText] = useState<string>('');
  const [editingComparisonHeaderPlanId, setEditingComparisonHeaderPlanId] = useState<string | null>(null);
  const [editingComparisonHeaderText, setEditingComparisonHeaderText] = useState<string>('');

  const [editCard, setEditCard] = useState<Partial<FeaturedCard> | null>(null);
  const [editCategory, setEditCategory] = useState<Partial<Category> | null>(null);
  const [editFaq, setEditFaq] = useState<Partial<FAQ> | null>(null);
  const [showAddFaqModal, setShowAddFaqModal] = useState(false);
  const [editSubs, setEditSubs] = useState<Subcategory[]>([]);
  const [editSubcategory, setEditSubcategory] = useState<Partial<Subcategory> | null>(null);
  const [editOffer, setEditOffer] = useState<Partial<Offer> | null>(null);
  const [editAd2, setEditAd2] = useState<Partial<Ad2> | null>(null);
  const [editAd3, setEditAd3] = useState<Partial<Ad3> | null>(null);
  const [editButtons, setEditButtons] = useState<CategoryButton[]>([]);
  const [editButtonsState, setEditButtonsState] = useState<Record<string, CategoryButton[]>>({});
  const [editShowBrandsState, setEditShowBrandsState] = useState<Record<string, boolean>>({});
  const [editBrandsTabLabelState, setEditBrandsTabLabelState] = useState<Record<string, string>>({});
  const [editSubBrands, setEditSubBrands] = useState<SubcategoryBrand[]>([]);
  const [editSubBrandsState, setEditSubBrandsState] = useState<Record<string, SubcategoryBrand[]>>({});
  const [editKeyFeaturesTabLabelState, setEditKeyFeaturesTabLabelState] = useState<Record<string, string>>({});
  const [editTabOrderState, setEditTabOrderState] = useState<Record<string, string[]>>({});
  const [editAd1, setEditAd1] = useState<Partial<Ad2> | null>(null);
  const [editSubOverviewPoints, setEditSubOverviewPoints] = useState<SubcategoryOverviewPoint[]>([]);
  const [editSubOverviewPointsState, setEditSubOverviewPointsState] = useState<Record<string, SubcategoryOverviewPoint[]>>({});
  const [keyFeaturesSections, setKeyFeaturesSections] = useState<SubcategoryKeyFeaturesSection[]>([]);
  const [editKeyFeaturesSections, setEditKeyFeaturesSections] = useState<Record<string, SubcategoryKeyFeaturesSection[]>>({});
  const [editShowAboutSectionState, setEditShowAboutSectionState] = useState<Record<string, boolean>>({});
  const [editShowHeaderPointsSectionState, setEditShowHeaderPointsSectionState] = useState<Record<string, boolean>>({});

  // State for multiple About sections
  const [aboutSections, setAboutSections] = useState<SubcategoryAboutSection[]>([]);
  const [editAboutSections, setEditAboutSections] = useState<Record<string, SubcategoryAboutSection[]>>({});
  const [editAboutSectionVisibility, setEditAboutSectionVisibility] = useState<Record<string, Record<string, boolean>>>({});
  const [editingAboutSection, setEditingAboutSection] = useState<Partial<SubcategoryAboutSection> | null>(null);

  // Inline edit view state for subcategories
  const [editingSubcategoryId, setEditingSubcategoryId] = useState<string | null>(null);
  const [editingBrandId, setEditingBrandId] = useState<string | null>(null);
  const [editingBrand, setEditingBrand] = useState<Partial<SubcategoryBrand> | null>(null);
  const [isSavingCategory, setIsSavingCategory] = useState(false);

  // Modal state for adding sections
  const [showAddSectionModal, setShowAddSectionModal] = useState(false);
  const [addSectionType, setAddSectionType] = useState<string>('');
  const [addSectionName, setAddSectionName] = useState('');
  const [addingSectionLoading, setAddingSectionLoading] = useState(false);

  // State for editing section names
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editingSectionName, setEditingSectionName] = useState('');

  // State for editing section headings
  const [editingHeadingSectionId, setEditingHeadingSectionId] = useState<string | null>(null);
  const [editingHeadingText, setEditingHeadingText] = useState('');
  const [editingHeadingVisible, setEditingHeadingVisible] = useState(true);
  const [editingHeadingBackgroundColor, setEditingHeadingBackgroundColor] = useState('');

  // Track which section instance is being edited for each type
  const [selectedCardsSectionId, setSelectedCardsSectionId] = useState<string>('');
  const [selectedCategoriesSectionId, setSelectedCategoriesSectionId] = useState<string>('');
  const [selectedOffersSectionId, setSelectedOffersSectionId] = useState<string>('');
  const [selectedAds2SectionId, setSelectedAds2SectionId] = useState<string>('');
  const [selectedAds3SectionId, setSelectedAds3SectionId] = useState<string>('');
  const [selectedAds1SectionId, setSelectedAds1SectionId] = useState<string>('');
  const [productAdminTab, setProductAdminTab] = useState<ProductAdminTab>('layout');
  const [productCards, setProductCards] = useState<FeaturedCardItem[]>([]);
  const [productOffers, setProductOffers] = useState<OfferItem[]>([]);
  const [productAds2, setProductAds2] = useState<Ad2Item[]>([]);
  const [productAds3, setProductAds3] = useState<Ad3Item[]>([]);
  const [productSelectedCardsSectionId, setProductSelectedCardsSectionId] = useState('');
  const [productSelectedOffersSectionId, setProductSelectedOffersSectionId] = useState('');
  const [productSelectedAds1SectionId, setProductSelectedAds1SectionId] = useState('');
  const [productSelectedAds2SectionId, setProductSelectedAds2SectionId] = useState('');
  const [productSelectedAds3SectionId, setProductSelectedAds3SectionId] = useState('');
  const [productShowAddSectionModal, setProductShowAddSectionModal] = useState(false);
  const [productAddSectionType, setProductAddSectionType] = useState<ProductAdminTab>('cards');
  const [productAddSectionName, setProductAddSectionName] = useState('');
  const [productHeadingModalSectionId, setProductHeadingModalSectionId] = useState('');
  const [productHeadingModalValue, setProductHeadingModalValue] = useState('');
  const [productHeadingVisible, setProductHeadingVisible] = useState(true);
  const [productHeadingBackgroundColor, setProductHeadingBackgroundColor] = useState('');
  const [productEditCard, setProductEditCard] = useState<Partial<FeaturedCardItem> | null>(null);
  const [productEditOffer, setProductEditOffer] = useState<Partial<OfferItem> | null>(null);
  const [productEditAd1, setProductEditAd1] = useState<Partial<Ad2Item> | null>(null);
  const [productEditAd2, setProductEditAd2] = useState<Partial<Ad2Item> | null>(null);
  const [productEditAd3, setProductEditAd3] = useState<Partial<Ad3Item> | null>(null);
  const [productSectionsLocal, setProductSectionsLocal] = useState<ScopedPageSection[]>([]);

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const productSensors = sensors;
  const {
    sections: productSections,
    addSection: addProductSection,
    deleteSection: deleteProductSection,
    updateSection: updateProductSection,
    refetch: refetchProductSections,
  } = useScopedSectionInstances({
    tableName: PRODUCT_SECTION_TABLE,
    scopeColumn: 'subcategory_id',
    scopeValue: editingSubcategoryId || '',
  });

  // Sync sections from hook to local state
  useEffect(() => {
    setSections(sectionsFromHook);

    const getFirstSectionIdByType = (type: string) => sectionsFromHook.find(s => s.section_type === type)?.id || '';

    setSelectedCardsSectionId((current) => current && sectionsFromHook.some(s => s.id === current) ? current : getFirstSectionIdByType('cards'));
    setSelectedCategoriesSectionId((current) => current && sectionsFromHook.some(s => s.id === current) ? current : getFirstSectionIdByType('categories'));
    setSelectedOffersSectionId((current) => current && sectionsFromHook.some(s => s.id === current) ? current : getFirstSectionIdByType('offers'));
    setSelectedAds2SectionId((current) => current && sectionsFromHook.some(s => s.id === current) ? current : getFirstSectionIdByType('ads_2col'));
    setSelectedAds3SectionId((current) => current && sectionsFromHook.some(s => s.id === current) ? current : getFirstSectionIdByType('ads_3col'));
    setSelectedAds1SectionId((current) => current && sectionsFromHook.some(s => s.id === current) ? current : getFirstSectionIdByType('ads_1col'));
  }, [sectionsFromHook]);

  const selectedCardsSection = sections.find(s => s.id === selectedCardsSectionId);
  const selectedOffersSection = sections.find(s => s.id === selectedOffersSectionId);
  const selectedAds2Section = sections.find(s => s.id === selectedAds2SectionId);
  const selectedAds3Section = sections.find(s => s.id === selectedAds3SectionId) || sections.find(s => s.section_type === 'ads_3col');

  useEffect(() => {
    setProductSectionsLocal(productSections);
  }, [productSections]);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) navigate('/admin/login');
  }, [loading, user, isAdmin]);

  useEffect(() => {
    let mounted = true;

    const loadAllSafe = async () => {
      try {
        const [s, h, header, c, cat, sub, o, a2, a3, btns, aboutSects, contact, kfSections, legal, footer, subscribers, faqsData, advertiseSettingsData, advertiseCardsData, advertiseSectionsData, getListedPlansData, getListedPlanFeaturesData, getListedComparisonRowsData, getListedComparisonCellsData, getListedSettingsData, writeForUsSettingsData, vendorGuidelinesSettingsData, browseAllDirectoriesSettingsData] = await Promise.all([
          supabase.from('page_sections').select('*').order('sort_order'),
          supabase.from('hero_settings').select('*').limit(1).maybeSingle().then(res => res, err => ({ data: null, error: err })),
          supabase.from('header_settings').select('*').limit(1).maybeSingle().then(res => res, err => ({ data: null, error: err })),
          supabase.from('featured_cards').select('*').order('sort_order'),
          supabase.from('categories').select('*').order('sort_order'),
          supabase.from('subcategories').select('*').order('sort_order'),
          supabase.from('offers').select('*').order('sort_order'),
          supabase.from('ads_2col').select('*').order('sort_order'),
          supabase.from('ads_3col').select('*').order('sort_order'),
          supabase.from('category_buttons').select('*').order('sort_order'),
          supabase.from('subcategory_about_sections' as any).select('*').order('sort_order').then(res => res, err => ({ data: null, error: err })),
          supabase.from('contact_settings').select('*').limit(1).maybeSingle().then(res => res, err => ({ data: null, error: err })),
          supabase.from('subcategory_key_features_sections' as any).select('*').order('sort_order').then(res => res, err => ({ data: null, error: err })),
          supabase.from('legal_pages').select('*').then(res => res, err => ({ data: null, error: err })),
          supabase.from('footer_settings').select('*').limit(1).maybeSingle().then(res => res, err => ({ data: null, error: err })),
          supabase.from('footer_subscribers').select('*').order('created_at', { ascending: false }).then(res => res, err => ({ data: null, error: err })),
          supabase.from('faqs').select('*').order('sort_order', { ascending: true }).then(res => res, err => ({ data: null, error: err })),
          supabase.from('advertise_page_settings').select('*').limit(1).maybeSingle().then(res => res, err => ({ data: null, error: err })),
          supabase.from('advertise_cards').select('*').order('sort_order').then(res => res, err => ({ data: [], error: err })),
          supabase.from('advertise_sections').select('*').order('sort_order').then(res => res, err => ({ data: [], error: err })),
          supabase.from('get_listed_plans').select('*').order('sort_order').then(res => res, err => ({ data: [], error: err })),
          supabase.from('get_listed_plan_features').select('*').order('sort_order').then(res => res, err => ({ data: [], error: err })),
          supabase.from('get_listed_comparison_rows').select('*').order('sort_order').then(res => res, err => ({ data: [], error: err })),
          supabase.from('get_listed_comparison_cells').select('*').then(res => res, err => ({ data: [], error: err })),
          supabase.from('get_listed_settings').select('*').order('updated_at', { ascending: false }).limit(1).maybeSingle().then(res => res, err => ({ data: null, error: err })),
          (supabase as any).from('write_for_us_settings').select('*').limit(1).maybeSingle().then(res => res, err => ({ data: null, error: err })),
          (supabase as any).from('vendor_guidelines_settings').select('*').limit(1).maybeSingle().then(res => res, err => ({ data: null, error: err })),
          (supabase as any).from('browse_all_directories_settings').select('*').limit(1).maybeSingle().then(res => res, err => ({ data: null, error: err })),
        ]);

        let subBrands;
        try {
          const result = await supabase.from('subcategory_brands' as any).select('*');
          subBrands = result;
        } catch {
          subBrands = { data: [] };
        }
        let subOverviewPoints;
        try {
          const result = await supabase.from('subcategory_overview_points' as any).select('*');
          subOverviewPoints = result;
        } catch {
          subOverviewPoints = { data: [] };
        }

        if (!mounted) return;

        if (s.data) setSections(s.data);
        console.log('📥 Fetched contact settings data from Supabase:', contact.data);

        // Process contact settings
        if (contact.data) {
          // If we have data from Supabase, use it directly
          console.log('✅ Loading contact settings from database');
          setContactSettings({
            id: contact.data.id,
            heading: contact.data.heading ?? '',
            email_label: contact.data.email_label ?? '',
            email: contact.data.email ?? '',
            description_1: contact.data.description_1 ?? '',
            description_2: contact.data.description_2 ?? '',
            image_url: contact.data.image_url ?? '',
            phone: (contact.data as any).phone ?? '',
            whatsapp: (contact.data as any).whatsapp ?? '',
            address: (contact.data as any).address ?? '',
            form_embed: (contact.data as any).form_embed ?? '',
            contact_emails: (contact.data as any).contact_emails ?? [],
            nodal_officer_title: (contact.data as any).nodal_officer_title ?? '',
            nodal_officer_name: (contact.data as any).nodal_officer_name ?? '',
            nodal_officer_phone: (contact.data as any).nodal_officer_phone ?? '',
            nodal_officer_email: (contact.data as any).nodal_officer_email ?? '',
            nodal_officer_visible: (contact.data as any).nodal_officer_visible ?? true,
            appellate_authority_title: (contact.data as any).appellate_authority_title ?? '',
            appellate_authority_name: (contact.data as any).appellate_authority_name ?? '',
            appellate_authority_phone: (contact.data as any).appellate_authority_phone ?? '',
            appellate_authority_email: (contact.data as any).appellate_authority_email ?? '',
            appellate_authority_visible: (contact.data as any).appellate_authority_visible ?? true,
            is_visible: (contact.data as any).is_visible ?? true,
          });
        } else {
          console.log('⚠️ No contact settings data found in database');
          // Keep default state if no data (don't overwrite)
        }

        // Mark contact settings as loaded
        setIsLoadingContactSettings(false);
        if (header.data) setHeaderSettings(header.data);
        if (footer.data) {
          const footerData = footer.data as any;
          setFooterSettings({
            id: footerData.id,
            description: footerData.description ?? '',
            description_visible: footerData.description_visible ?? true,
            twitter_label: footerData.twitter_label ?? 'Twitter',
            twitter_link: footerData.twitter_link ?? '#',
            twitter_visible: footerData.twitter_visible ?? true,
            linkedin_label: footerData.linkedin_label ?? 'LinkedIn',
            linkedin_link: footerData.linkedin_link ?? '#',
            linkedin_visible: footerData.linkedin_visible ?? true,
            facebook_label: footerData.facebook_label ?? 'Facebook',
            facebook_link: footerData.facebook_link ?? '#',
            facebook_visible: footerData.facebook_visible ?? true,
            instagram_label: footerData.instagram_label ?? 'Instagram',
            instagram_link: footerData.instagram_link ?? '#',
            instagram_visible: footerData.instagram_visible ?? false,
            youtube_label: footerData.youtube_label ?? 'YouTube',
            youtube_link: footerData.youtube_link ?? '#',
            youtube_visible: footerData.youtube_visible ?? false,
            social_whatsapp_visible: footerData.social_whatsapp_visible ?? false,
            social_media_visible: footerData.social_media_visible ?? true,
            about_us_visible: footerData.about_us_visible ?? true,
            contact_visible: footerData.contact_visible ?? true,
            privacy_policy_visible: footerData.privacy_policy_visible ?? true,
            terms_of_service_visible: footerData.terms_of_service_visible ?? true,
            refund_policy_visible: footerData.refund_policy_visible ?? true,
            refund_policy_1_visible: footerData.refund_policy_1_visible ?? true,
            refund_policy_2_visible: footerData.refund_policy_2_visible ?? true,
            refund_policy_3_visible: footerData.refund_policy_3_visible ?? true,
            refund_policy_4_visible: footerData.refund_policy_4_visible ?? true,
            faq_visible: footerData.faq_visible ?? true,
            faq_heading: footerData.faq_heading ?? 'Frequently Asked Questions',
            whatsapp_number: footerData.whatsapp_number ?? '',
            whatsapp_visible: footerData.whatsapp_visible ?? false,
            phone: footerData.phone ?? '',
            phone_visible: footerData.phone_visible ?? false,
            email: footerData.email ?? '',
            email_visible: footerData.email_visible ?? false,
            bottom_footer_email: footerData.bottom_footer_email ?? '',
            bottom_footer_email_visible: footerData.bottom_footer_email_visible ?? false,
            bottom_branding_visible: footerData.bottom_branding_visible ?? true,
            bottom_branding_text: footerData.bottom_branding_text ?? '',
            submit_rft_label: footerData.submit_rft_label ?? 'Submit RFT',
            submit_rft_url: footerData.submit_rft_url ?? '',
            submit_rft_enabled: footerData.submit_rft_enabled ?? false,
            get_recommendations_label: footerData.get_recommendations_label ?? 'Get Recommendations',
            get_recommendations_url: footerData.get_recommendations_url ?? '',
            get_recommendations_enabled: footerData.get_recommendations_enabled ?? false,
            get_listed_visible: footerData.get_listed_visible ?? true,
            advertise_visible: footerData.advertise_visible ?? true,
            write_for_us_visible: footerData.write_for_us_visible ?? true,
            vendor_guidelines_visible: footerData.vendor_guidelines_visible ?? true,
            view_all_categories_visible: footerData.view_all_categories_visible ?? true,
            vendors_visible: footerData.vendors_visible ?? true,
            buyers_visible: footerData.buyers_visible ?? true,
          });
        }
        if (subscribers.data) {
          setFooterSubscribers(
            (subscribers.data as Array<{ id: string; email: string; created_at: string }>).map(subscriber => ({
              id: subscriber.id,
              email: subscriber.email,
              created_at: subscriber.created_at,
            }))
          );
        }
        if (legal.data) {
          setLegalPages(legal.data as LegalPage[]);
          // Initialize editable titles and visibility
          const titles: Record<string, string> = {};
          const visibility: Record<string, boolean> = {};
          legal.data.forEach((page: any) => {
            titles[page.slug] = page.title;
            visibility[page.slug] = page.is_visible ?? true;
          });
          setEditableLegalTitles(titles);
          setEditableLegalVisibility(visibility);
        }
        if (faqsData.data) setFaqs(faqsData.data as FAQ[]);
        if (h.data) {
          const heroData = h.data as any;
          // Try to split main_text using ||| delimiter
          const mainText = heroData.main_text || '';
          let part1 = '';
          let part2 = '';
          if (mainText.includes('|||')) {
            const split = mainText.split('|||');
            part1 = split[0] || '';
            part2 = split[1] || '';
          } else {
            // Backward compatibility: if no delimiter, use whole text as part1
            part1 = mainText;
          }
          setHeroTextPart1(part1);
          setHeroTextPart2(part2);
          console.log('Loading hero words:', heroData.animated_words);
          const loadedWords: string[] = heroData.animated_words || [];
          const loadedVisibilityRaw: boolean[] = Array.isArray(heroData.animated_word_visibility)
            ? heroData.animated_word_visibility
            : [];
          setHeroWords(loadedWords);
          setHeroAnimatedWordVisibility(loadedWords.map((_, index) => loadedVisibilityRaw[index] ?? true));
          setHeroVisible(heroData.hero_visible ?? true);
          setHeroTextPart1Visible(heroData.hero_text_part1_visible ?? true);
          setHeroTextPart2Visible(heroData.hero_text_part2_visible ?? true);
          setHeroAnimatedWordsVisible(heroData.hero_animated_words_visible ?? true);
          setHeroSearchVisible(heroData.hero_search_visible ?? true);
        }
        if (c.data) setCards((c.data as any[]).map(card => ({ ...card, link: card.link ?? null, is_fixed: card.is_fixed ?? false, show_border: card.show_border ?? false, border_color: card.border_color ?? null })));
        if (cat.data) setCategories(cat.data);
        if (sub.data) {
          setSubcategories(sub.data as unknown as Subcategory[]);
          const map: Record<string, string> = {};
          const keyFeaturesLabels: Record<string, string> = {};
          const brandsLabels: Record<string, string> = {};

          sub.data.forEach((s: any) => {
            map[s.id] = s.name;
            keyFeaturesLabels[s.id] = s.key_features_tab_label || 'Key Features';
            brandsLabels[s.id] = s.brands_tab_label || 'Brands';
          });
          setSubcategoriesMap(map);
          setEditKeyFeaturesTabLabelState(keyFeaturesLabels);
          setEditBrandsTabLabelState(brandsLabels);
        }
        if (o.data) setOffers((o.data as any[]).map(offer => ({ ...offer, is_fixed: offer.is_fixed ?? false, show_border: offer.show_border ?? false, border_color: offer.border_color ?? null, background_color: offer.background_color ?? null, show_image: offer.show_image ?? true })));
        if (a2.data) setAds2((a2.data as any[]).map(ad => ({ ...ad, is_fixed: ad.is_fixed ?? false, show_border: ad.show_border ?? false, border_color: ad.border_color ?? null, background_color: ad.background_color ?? null, show_image: ad.show_image ?? true })));
        if (a3.data) setAds3((a3.data as any[]).map(ad => ({ ...ad, is_fixed: ad.is_fixed ?? false, show_border: ad.show_border ?? false, border_color: ad.border_color ?? null, background_color: ad.background_color ?? null, show_image: ad.show_image ?? true })));
        if (btns.data) {
          setButtons(btns.data);
          const buttonsBySubcategory: Record<string, CategoryButton[]> = {};
          btns.data.forEach((btn: any) => {
            if (btn.subcategory_id) {
              if (!buttonsBySubcategory[btn.subcategory_id]) {
                buttonsBySubcategory[btn.subcategory_id] = [];
              }
              buttonsBySubcategory[btn.subcategory_id].push({
                id: btn.id,
                label: btn.label,
                link: btn.link,
                is_visible: btn.is_visible,
              });
            }
          });
          setEditButtonsState(buttonsBySubcategory);
        }
        if (subBrands.data) {
          const brandsBySubcategory: Record<string, SubcategoryBrand[]> = {};
          subBrands.data.forEach((brand: any) => {
            if (!brandsBySubcategory[brand.subcategory_id]) {
              brandsBySubcategory[brand.subcategory_id] = [];
            }
            brandsBySubcategory[brand.subcategory_id].push({
              id: brand.id,
              name: brand.name,
              logo_url: brand.logo_url,
              link: brand.link,
              description: brand.description,
              buttons: brand.buttons || [],
              is_visible: brand.is_visible,
              action_links: normalizeAdminBrandActionLinks(brand),
              action_link_1_text: brand.action_link_1_text,
              action_link_1_url: brand.action_link_1_url,
              action_link_1_new_tab: brand.action_link_1_new_tab,
              action_link_1_enabled: brand.action_link_1_enabled,
              action_link_2_text: brand.action_link_2_text,
              action_link_2_url: brand.action_link_2_url,
              action_link_2_new_tab: brand.action_link_2_new_tab,
              action_link_2_enabled: brand.action_link_2_enabled,
              action_link_3_text: brand.action_link_3_text,
              action_link_3_url: brand.action_link_3_url,
              action_link_3_new_tab: brand.action_link_3_new_tab,
              action_link_3_enabled: brand.action_link_3_enabled,
              primary_cta_label: brand.primary_cta_label,
              primary_cta_link: brand.primary_cta_link,
              primary_cta_visible: brand.primary_cta_visible,
              more_actions_label: brand.more_actions_label,
              more_actions_visible: brand.more_actions_visible,
              join_network_label: brand.join_network_label,
              join_network_link: brand.join_network_link,
              join_network_visible: brand.join_network_visible
            });
          });
          setEditSubBrandsState(brandsBySubcategory);
        }
        if (subOverviewPoints.data) {
          const pointsBySubcategory: Record<string, SubcategoryOverviewPoint[]> = {};
          subOverviewPoints.data.forEach((point: any) => {
            if (!pointsBySubcategory[point.subcategory_id]) {
              pointsBySubcategory[point.subcategory_id] = [];
            }
            pointsBySubcategory[point.subcategory_id].push({
              id: point.id,
              subcategory_id: point.subcategory_id,
              section_id: point.section_id,
              text: point.text,
              is_highlighted: point.is_highlighted,
              highlight_color: point.highlight_color === 'blue' ? 'blue' : 'green',
              sort_order: point.sort_order,
            });
          });
          setEditSubOverviewPointsState(pointsBySubcategory);
        }
        if (aboutSects.data) {
          setAboutSections(aboutSects.data as unknown as SubcategoryAboutSection[]);
          const aboutSectionsBySubcategory: Record<string, SubcategoryAboutSection[]> = {};
          const aboutSectionVisibilityBySubcategory: Record<string, Record<string, boolean>> = {};
          aboutSects.data.forEach((section: any) => {
            if (!aboutSectionsBySubcategory[section.subcategory_id]) {
              aboutSectionsBySubcategory[section.subcategory_id] = [];
              aboutSectionVisibilityBySubcategory[section.subcategory_id] = {};
            }
            aboutSectionsBySubcategory[section.subcategory_id].push({
              id: section.id,
              subcategory_id: section.subcategory_id,
              heading: section.heading,
              content: section.content,
              background_color: section.background_color || '#ffffff',
              heading_color: section.heading_color || '#000000',
              sort_order: section.sort_order,
              created_at: section.created_at,
              updated_at: section.updated_at,
            });
            aboutSectionVisibilityBySubcategory[section.subcategory_id][section.id] = section.is_visible ?? true;
          });
          setEditAboutSections(aboutSectionsBySubcategory);
          setEditAboutSectionVisibility(aboutSectionVisibilityBySubcategory);
        }
        if (kfSections.data) {
          setKeyFeaturesSections(kfSections.data as unknown as SubcategoryKeyFeaturesSection[]);
          const groupedKFSections: Record<string, SubcategoryKeyFeaturesSection[]> = {};
          kfSections.data.forEach((section: any) => {
            if (!groupedKFSections[section.subcategory_id]) groupedKFSections[section.subcategory_id] = [];
            groupedKFSections[section.subcategory_id].push({
              id: section.id,
              subcategory_id: section.subcategory_id,
              heading: section.heading,
              is_visible: section.is_visible,
              sort_order: section.sort_order,
            });
          });
          setEditKeyFeaturesSections(groupedKFSections);
        }

        // Load Advertise Data
        console.log('📥 Fetched advertise settings data from Supabase:', advertiseSettingsData);
        if (advertiseSettingsData.data) {
          console.log('✅ Setting advertise settings:', advertiseSettingsData.data);
          const raw = advertiseSettingsData.data as any;
          setAdvertiseSettings({
            ...raw,
            hero_button_visible: raw.hero_button_visible ?? true,
          });
        } else {
          console.log('⚠️ No advertise settings data found');
        }
        if (advertiseCardsData.data) {
          setAdvertiseCards(advertiseCardsData.data as AdvertiseCard[]);
        }
        if (advertiseSectionsData.data) {
          setAdvertiseSections(advertiseSectionsData.data as AdvertiseSection[]);
        }
        if (getListedPlansData.data) {
          setGetListedPlans(getListedPlansData.data as GetListedPlan[]);
        }
        if (getListedPlanFeaturesData.data) {
          setGetListedPlanFeatures(getListedPlanFeaturesData.data as GetListedPlanFeature[]);
        }
        if (getListedComparisonRowsData.data) {
          setGetListedComparisonRows(getListedComparisonRowsData.data as GetListedComparisonRow[]);
        }
        if (getListedComparisonCellsData.data) {
          setGetListedComparisonCells(getListedComparisonCellsData.data as GetListedComparisonCell[]);
        }
        if (getListedSettingsData.data) {
          setGetListedSettings(getListedSettingsData.data as unknown as GetListedSettings);
        }
        if (writeForUsSettingsData.data) {
          setWriteForUsSettings(writeForUsSettingsData.data as WriteForUsSettings);
        }
        if (vendorGuidelinesSettingsData.data) {
          setVendorGuidelinesSettings(vendorGuidelinesSettingsData.data as VendorGuidelinesSettings);
        }
        if (browseAllDirectoriesSettingsData.data) {
          setBrowseAllDirectoriesSettings(browseAllDirectoriesSettingsData.data as BrowseAllDirectoriesSettings);
        }
      } catch (error) {
        console.error('Error in loadAllSafe:', error);
      }
    };

    loadAllSafe();

    const channel = supabase
      .channel('admin-dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'page_sections' }, loadAllSafe)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'hero_settings' }, loadAllSafe)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'featured_cards' }, loadAllSafe)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, loadAllSafe)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subcategories' }, loadAllSafe)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'offers' }, loadAllSafe)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ads_2col' }, loadAllSafe)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ads_3col' }, loadAllSafe)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'category_buttons' }, loadAllSafe)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subcategory_brands' }, loadAllSafe)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subcategory_overview_points' as any }, loadAllSafe)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subcategory_about_sections' }, loadAllSafe)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subcategory_key_features_sections' as any }, loadAllSafe)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'header_settings' as any }, loadAllSafe)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'footer_settings' as any }, loadAllSafe)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'advertise_page_settings' }, loadAllSafe)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'advertise_cards' }, loadAllSafe)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'advertise_sections' }, loadAllSafe)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'get_listed_plans' }, loadAllSafe)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'get_listed_plan_features' }, loadAllSafe)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'get_listed_comparison_rows' }, loadAllSafe)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'get_listed_comparison_cells' }, loadAllSafe)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'get_listed_settings' }, loadAllSafe)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'write_for_us_settings' }, loadAllSafe)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vendor_guidelines_settings' }, loadAllSafe)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'browse_all_directories_settings' }, loadAllSafe)
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  async function loadAll() {
    const writeForUsSettingsPromise = (supabase as any)
      .from('write_for_us_settings')
      .select('*')
      .limit(1)
      .maybeSingle()
      .then(res => res, err => ({ data: null, error: err }));
    const vendorGuidelinesSettingsPromise = (supabase as any)
      .from('vendor_guidelines_settings')
      .select('*')
      .limit(1)
      .maybeSingle()
      .then(res => res, err => ({ data: null, error: err }));
    const browseAllDirectoriesSettingsPromise = (supabase as any)
      .from('browse_all_directories_settings')
      .select('*')
      .limit(1)
      .maybeSingle()
      .then(res => res, err => ({ data: null, error: err }));

    const [s, h, header, c, cat, sub, o, a2, a3, btns, aboutSects, contact, kfSections, legal, footer, faqsData, advertiseSettingsData, advertiseCardsData, advertiseSectionsData, getListedPlansData, getListedPlanFeaturesData, getListedComparisonRowsData, getListedComparisonCellsData, getListedSettingsData] = await Promise.all([
      supabase.from('page_sections').select('*').order('sort_order'),
      supabase.from('hero_settings').select('*').limit(1).maybeSingle().then(res => res, err => ({ data: null, error: err })),
      supabase.from('header_settings').select('*').limit(1).maybeSingle().then(res => res, err => ({ data: null, error: err })),
      supabase.from('featured_cards').select('*').order('sort_order'),
      supabase.from('categories').select('*').order('sort_order'),
      supabase.from('subcategories').select('*').order('sort_order'),
      supabase.from('offers').select('*').order('sort_order'),
      supabase.from('ads_2col').select('*').order('sort_order'),
      supabase.from('ads_3col').select('*').order('sort_order'),
      supabase.from('category_buttons').select('*').order('sort_order'),
      supabase.from('subcategory_about_sections' as any).select('*').order('sort_order').then(res => res, err => ({ data: null, error: err })),
      supabase.from('contact_settings').select('*').limit(1).maybeSingle().then(res => res, err => ({ data: null, error: err })),
      supabase.from('subcategory_key_features_sections' as any).select('*').order('sort_order').then(res => res, err => ({ data: null, error: err })),
      supabase.from('legal_pages').select('*').then(res => res, err => ({ data: null, error: err })),
      supabase.from('footer_settings').select('*').limit(1).maybeSingle().then(res => res, err => ({ data: null, error: err })),
      supabase.from('faqs').select('*').order('sort_order', { ascending: true }).then(res => res, err => ({ data: null, error: err })),
      supabase.from('advertise_page_settings').select('*').limit(1).maybeSingle().then(res => res, err => ({ data: null, error: err })),
      supabase.from('advertise_cards').select('*').order('sort_order').then(res => res, err => ({ data: [], error: err })),
      supabase.from('advertise_sections').select('*').order('sort_order').then(res => res, err => ({ data: [], error: err })),
      supabase.from('get_listed_plans').select('*').order('sort_order').then(res => res, err => ({ data: [], error: err })),
      supabase.from('get_listed_plan_features').select('*').order('sort_order').then(res => res, err => ({ data: [], error: err })),
      supabase.from('get_listed_comparison_rows').select('*').order('sort_order').then(res => res, err => ({ data: [], error: err })),
      supabase.from('get_listed_comparison_cells').select('*').then(res => res, err => ({ data: [], error: err })),
      supabase.from('get_listed_settings').select('*').order('updated_at', { ascending: false }).limit(1).maybeSingle().then(res => res, err => ({ data: null, error: err })),
    ]);

    const [writeForUsSettingsData, vendorGuidelinesSettingsData, browseAllDirectoriesSettingsData] = await Promise.all([
      writeForUsSettingsPromise,
      vendorGuidelinesSettingsPromise,
      browseAllDirectoriesSettingsPromise,
    ]);
    let subBrands;
    try {
      const result = await supabase.from('subcategory_brands' as any).select('*');
      subBrands = result;
    } catch {
      subBrands = { data: [] };
    }
    let subOverviewPoints;
    try {
      const result = await supabase.from('subcategory_overview_points' as any).select('*');
      subOverviewPoints = result;
    } catch {
      subOverviewPoints = { data: [] };
    }
    if (s.data) setSections(s.data);
    if (contact.data) setContactSettings(contact.data as any);
    if (header.data) setHeaderSettings(header.data as any);
    if (footer.data) setFooterSettings({
      description: footer.data.description ?? '',
      description_visible: true,
      social_media_visible: true,
      about_us_visible: true,
      contact_visible: true,
      privacy_policy_visible: true,
      terms_of_service_visible: true,
      refund_policy_visible: true,
      twitter_label: 'Twitter',
      twitter_link: '#',
      twitter_visible: true,
      linkedin_label: 'LinkedIn',
      linkedin_link: '#',
      linkedin_visible: true,
      facebook_label: 'Facebook',
      facebook_link: '#',
      facebook_visible: true,
      instagram_label: 'Instagram',
      instagram_link: '#',
      instagram_visible: false,
      youtube_label: 'YouTube',
      youtube_link: '#',
      youtube_visible: false,
      bottom_branding_visible: true,
      bottom_branding_text: '',
      ...footer.data
    });
    if (legal.data) setLegalPages(legal.data as LegalPage[]);
    if (faqsData.data) setFaqs(faqsData.data as FAQ[]);
    if (h.data) {
      const heroData = h.data as any;
      // Try to split main_text using ||| delimiter
      const mainText = heroData.main_text || '';
      let part1 = '';
      let part2 = '';
      if (mainText.includes('|||')) {
        const split = mainText.split('|||');
        part1 = split[0] || '';
        part2 = split[1] || '';
      } else {
        // Backward compatibility: if no delimiter, use whole text as part1
        part1 = mainText;
      }
      setHeroTextPart1(part1);
      setHeroTextPart2(part2);
      console.log('Loading hero words:', heroData.animated_words);
      setHeroWords(heroData.animated_words || []);
    }
    if (c.data) setCards((c.data as any[]).map(card => ({ ...card, link: card.link ?? null, is_fixed: card.is_fixed ?? false, show_border: card.show_border ?? false, border_color: card.border_color ?? null, is_visible: card.is_visible ?? true })));
    if (cat.data) setCategories(cat.data);
    if (sub.data) setSubcategories(sub.data as unknown as Subcategory[]);

    if (o.data) setOffers((o.data as any[]).map(offer => ({ ...offer, is_fixed: offer.is_fixed ?? false, show_border: offer.show_border ?? false, border_color: offer.border_color ?? null, is_visible: offer.is_visible ?? true })));
    if (a2.data) setAds2((a2.data as any[]).map(ad => ({ ...ad, is_fixed: ad.is_fixed ?? false, show_border: ad.show_border ?? false, border_color: ad.border_color ?? null, is_visible: ad.is_visible ?? true })));
    if (a3.data) setAds3((a3.data as any[]).map(ad => ({ ...ad, is_fixed: ad.is_fixed ?? false, show_border: ad.show_border ?? false, border_color: ad.border_color ?? null, is_visible: ad.is_visible ?? true })));
    if (btns.data) {
      setButtons(btns.data);
      // Populate editButtonsState with buttons keyed by subcategory_id
      const buttonsBySubcategory: Record<string, CategoryButton[]> = {};
      btns.data.forEach((btn: any) => {
        if (btn.subcategory_id) {
          if (!buttonsBySubcategory[btn.subcategory_id]) {
            buttonsBySubcategory[btn.subcategory_id] = [];
          }
          buttonsBySubcategory[btn.subcategory_id].push({
            id: btn.id,
            label: btn.label,
            link: btn.link,
            is_visible: btn.is_visible,
          });
        }
      });
      setEditButtonsState(buttonsBySubcategory);
    }

    if (subBrands.data) {
      const brandsBySubcategory: Record<string, SubcategoryBrand[]> = {};
      subBrands.data.forEach((brand: any) => {
        if (!brandsBySubcategory[brand.subcategory_id]) {
          brandsBySubcategory[brand.subcategory_id] = [];
        }
        brandsBySubcategory[brand.subcategory_id].push({
          id: brand.id,
          name: brand.name,
          logo_url: brand.logo_url,
          link: brand.link,
          description: brand.description,
          buttons: brand.buttons || [],
          is_visible: brand.is_visible,
          action_links: normalizeAdminBrandActionLinks(brand),
          action_link_1_text: brand.action_link_1_text,
          action_link_1_url: brand.action_link_1_url,
          action_link_1_new_tab: brand.action_link_1_new_tab,
          action_link_1_enabled: brand.action_link_1_enabled,
          action_link_2_text: brand.action_link_2_text,
          action_link_2_url: brand.action_link_2_url,
          action_link_2_new_tab: brand.action_link_2_new_tab,
          action_link_2_enabled: brand.action_link_2_enabled,
          action_link_3_text: brand.action_link_3_text,
          action_link_3_url: brand.action_link_3_url,
          action_link_3_new_tab: brand.action_link_3_new_tab,
          action_link_3_enabled: brand.action_link_3_enabled,
          primary_cta_label: brand.primary_cta_label,
          primary_cta_link: brand.primary_cta_link,
          primary_cta_visible: brand.primary_cta_visible,
          more_actions_label: brand.more_actions_label,
          more_actions_visible: brand.more_actions_visible,
          join_network_label: brand.join_network_label,
          join_network_link: brand.join_network_link,
          join_network_visible: brand.join_network_visible
        });
      });
      setEditSubBrandsState(brandsBySubcategory);
    }
    if (subOverviewPoints.data) {
      const pointsBySubcategory: Record<string, SubcategoryOverviewPoint[]> = {};
      subOverviewPoints.data.forEach((point: any) => {
        if (!pointsBySubcategory[point.subcategory_id]) {
          pointsBySubcategory[point.subcategory_id] = [];
        }
        pointsBySubcategory[point.subcategory_id].push({
          id: point.id,
          subcategory_id: point.subcategory_id,
          section_id: point.section_id,
          text: point.text,
          is_highlighted: point.is_highlighted,
          highlight_color: point.highlight_color === 'blue' ? 'blue' : 'green',
          sort_order: point.sort_order,
        });
      });
      setEditSubOverviewPointsState(pointsBySubcategory);
    }
    if (aboutSects.data) {
      setAboutSections(aboutSects.data as unknown as SubcategoryAboutSection[]);
      const aboutSectionsBySubcategory: Record<string, SubcategoryAboutSection[]> = {};
      aboutSects.data.forEach((section: any) => {
        if (!aboutSectionsBySubcategory[section.subcategory_id]) {
          aboutSectionsBySubcategory[section.subcategory_id] = [];
        }
        aboutSectionsBySubcategory[section.subcategory_id].push({
          id: section.id,
          subcategory_id: section.subcategory_id,
          heading: section.heading,
          content: section.content,
          background_color: section.background_color || '#ffffff',
          heading_color: section.heading_color || '#000000',
          sort_order: section.sort_order,
          created_at: section.created_at,
          updated_at: section.updated_at,
        });
      });
      setEditAboutSections(aboutSectionsBySubcategory);
    }

    if (kfSections.data) {
      setKeyFeaturesSections(kfSections.data as unknown as SubcategoryKeyFeaturesSection[]);
      const groupedKFSections: Record<string, SubcategoryKeyFeaturesSection[]> = {};
      kfSections.data.forEach((section: any) => {
        if (!groupedKFSections[section.subcategory_id]) groupedKFSections[section.subcategory_id] = [];
        groupedKFSections[section.subcategory_id].push({
          id: section.id,
          subcategory_id: section.subcategory_id,
          heading: section.heading,
          is_visible: section.is_visible,
          sort_order: section.sort_order,
        });
      });
      setEditKeyFeaturesSections(groupedKFSections);
    }

    // Load Advertise Data
    console.log('advertiseSettingsData:', advertiseSettingsData);
    console.log('advertiseCardsData:', advertiseCardsData);
    console.log('advertiseSectionsData:', advertiseSectionsData);

    if (advertiseSettingsData.data) {
      console.log('Setting advertiseSettings:', advertiseSettingsData.data);
      setAdvertiseSettings(advertiseSettingsData.data as AdvertiseSettings);
    } else {
      console.log('No advertiseSettingsData.data found');
    }

    if (advertiseCardsData.data) {
      setAdvertiseCards(advertiseCardsData.data as AdvertiseCard[]);
    }

    if (advertiseSectionsData.data) {
      setAdvertiseSections(advertiseSectionsData.data as AdvertiseSection[]);
    }

    // Load Get Listed Data
    if (getListedPlansData.data) {
      setGetListedPlans(getListedPlansData.data as GetListedPlan[]);
    }
    if (getListedPlanFeaturesData.data) {
      setGetListedPlanFeatures(getListedPlanFeaturesData.data as GetListedPlanFeature[]);
    }
    if (getListedComparisonRowsData.data) {
      setGetListedComparisonRows(getListedComparisonRowsData.data as GetListedComparisonRow[]);
    }
    if (getListedComparisonCellsData.data) {
      setGetListedComparisonCells(getListedComparisonCellsData.data as GetListedComparisonCell[]);
    }
    if (getListedSettingsData.data) {
      setGetListedSettings(getListedSettingsData.data as unknown as GetListedSettings);
    }
    if (writeForUsSettingsData.data) {
      setWriteForUsSettings(writeForUsSettingsData.data as WriteForUsSettings);
    }
    if (vendorGuidelinesSettingsData.data) {
      setVendorGuidelinesSettings(vendorGuidelinesSettingsData.data as VendorGuidelinesSettings);
    }
    if (browseAllDirectoriesSettingsData.data) {
      setBrowseAllDirectoriesSettings(browseAllDirectoriesSettingsData.data as BrowseAllDirectoriesSettings);
    }
  }

  async function refreshCategoryListData() {
    try {
      const [cat, sub] = await Promise.all([
        supabase.from('categories').select('*').order('sort_order'),
        supabase.from('subcategories').select('*').order('sort_order'),
      ]);

      if (cat.error) throw cat.error;
      if (sub.error) throw sub.error;

      if (cat.data) setCategories(cat.data);
      if (sub.data) setSubcategories(sub.data as unknown as Subcategory[]);
    } catch (error) {
      console.error('Error refreshing category list data:', error);
      throw error;
    }
  }

  const updateFooterVisibilitySetting = async (updates: Record<string, unknown>) => {
    const { data: footerData } = await supabase
      .from('footer_settings')
      .select('id')
      .limit(1)
      .maybeSingle();

    if (!footerData?.id) return;

    const { error } = await supabase
      .from('footer_settings')
      .update(updates as any)
      .eq('id', footerData.id);

    if (error) throw error;
  };

  // Advertise Page Functions
  const handleSaveAdvertiseSettings = async () => {
    try {
      console.log('Saving advertise settings:', advertiseSettings);

      // Prepare data with only existing database columns
      const dataToSave: any = {
        hero_small_heading: advertiseSettings.hero_small_heading,
        hero_main_heading: advertiseSettings.hero_main_heading,
        hero_description: advertiseSettings.hero_description,
        hero_button_text: advertiseSettings.hero_button_text,
        hero_button_link: advertiseSettings.hero_button_link,
        hero_button_visible: advertiseSettings.hero_button_visible,
        hero_image_url: advertiseSettings.hero_image_url,
        hero_image_visible: advertiseSettings.hero_image_visible,
        hero_visible: advertiseSettings.hero_visible,
        marketing_cards_main_heading: advertiseSettings.marketing_cards_main_heading,
        marketing_cards_subheading: advertiseSettings.marketing_cards_subheading,
        section3_small_heading: advertiseSettings.section3_small_heading,
        section3_main_heading: advertiseSettings.section3_main_heading,
        section3_description: advertiseSettings.section3_description,
        section3_image_url: advertiseSettings.section3_image_url,
        section3_background_color: advertiseSettings.section3_background_color,
        section3_visible: advertiseSettings.section3_visible,
        section4_small_heading: advertiseSettings.section4_small_heading,
        section4_main_heading: advertiseSettings.section4_main_heading,
        section4_description: advertiseSettings.section4_description,
        section4_button_text: advertiseSettings.section4_button_text,
        section4_button_link: advertiseSettings.section4_button_link,
        section4_image_url: advertiseSettings.section4_image_url,
        section4_visible: advertiseSettings.section4_visible,
        dynamic_sections_heading_part1: advertiseSettings.dynamic_sections_heading_part1,
        dynamic_sections_heading_part2: advertiseSettings.dynamic_sections_heading_part2,
        updated_at: new Date().toISOString(),
      };

      let result;
      if (advertiseSettings.id) {
        // Update existing record
        console.log('Updating existing record with id:', advertiseSettings.id);
        result = await supabase
          .from('advertise_page_settings')
          .update(dataToSave)
          .eq('id', advertiseSettings.id);
      } else {
        // Get first record ID or create new one
        console.log('Checking for existing data...');
        const { data: existingData } = await supabase
          .from('advertise_page_settings')
          .select('id')
          .limit(1);
        console.log('existingData:', existingData);

        if (existingData && existingData.length > 0) {
          console.log('Updating existing record:', existingData[0].id);
          result = await supabase
            .from('advertise_page_settings')
            .update(dataToSave)
            .eq('id', existingData[0].id);
        } else {
          console.log('Inserting new record');
          result = await supabase
            .from('advertise_page_settings')
            .insert([dataToSave])
            .select(); // Add select() to get the inserted data back!
        }
      }

      console.log('Supabase result:', result);
      const { error } = result;
      if (error) throw error;

      // Also save footer setting for Advertise
      await updateFooterVisibilitySetting({
        advertise_visible: footerSettings.advertise_visible ?? true,
      });

      console.log('Advertise settings saved successfully!');
      toast.success('Advertise settings saved successfully!');
      loadAll(); // Reload data to confirm save
    } catch (error: any) {
      console.error('Error saving advertise settings:', error);
      toast.error(`Failed to save advertise settings: ${error.message || 'Unknown error'}`);
    }
  };

  const handleSaveWriteForUsSettings = async () => {
    try {
      console.log('Saving write for us settings:', writeForUsSettings);

      const dataToSave: any = {
        heading: writeForUsSettings.heading,
        banner_image_url: writeForUsSettings.banner_image_url,
        content: writeForUsSettings.content,
        contact_email: writeForUsSettings.contact_email,
        contact_intro_text: writeForUsSettings.contact_intro_text,
        updated_at: new Date().toISOString(),
      };

      let result;
      if (writeForUsSettings.id) {
        console.log('Updating existing record with id:', writeForUsSettings.id);
        result = await supabase
          .from('write_for_us_settings')
          .update(dataToSave)
          .eq('id', writeForUsSettings.id);
      } else {
        console.log('Checking for existing data...');
        const { data: existingData } = await supabase
          .from('write_for_us_settings')
          .select('id')
          .limit(1);
        console.log('existingData:', existingData);

        if (existingData && existingData.length > 0) {
          console.log('Updating existing record:', existingData[0].id);
          result = await supabase
            .from('write_for_us_settings')
            .update(dataToSave)
            .eq('id', existingData[0].id);
        } else {
          console.log('Inserting new record');
          result = await supabase
            .from('write_for_us_settings')
            .insert([dataToSave])
            .select();
        }
      }

      console.log('Supabase result:', result);
      const { error } = result;
      if (error) throw error;

      // Also save footer setting for Write For Us
      await updateFooterVisibilitySetting({
        write_for_us_visible: footerSettings.write_for_us_visible ?? true,
      });

      console.log('Write For Us settings saved successfully!');
      toast.success('Write For Us settings saved successfully!');
      loadAll();
    } catch (error: any) {
      console.error('Error saving write for us settings:', error);
      toast.error(`Failed to save write for us settings: ${error.message || 'Unknown error'}`);
    }
  };

  const handleSaveVendorGuidelinesSettings = async () => {
    try {
      console.log('Saving vendor guidelines settings:', vendorGuidelinesSettings);

      const dataToSave: any = {
        heading: vendorGuidelinesSettings.heading,
        content: vendorGuidelinesSettings.content,
        contact_email: vendorGuidelinesSettings.contact_email,
        contact_intro_text: vendorGuidelinesSettings.contact_intro_text,
        updated_at: new Date().toISOString(),
      };

      let result;
      if (vendorGuidelinesSettings.id) {
        console.log('Updating existing record with id:', vendorGuidelinesSettings.id);
        result = await supabase
          .from('vendor_guidelines_settings')
          .update(dataToSave)
          .eq('id', vendorGuidelinesSettings.id);
      } else {
        console.log('Checking for existing data...');
        const { data: existingData } = await supabase
          .from('vendor_guidelines_settings')
          .select('id')
          .limit(1);
        console.log('existingData:', existingData);

        if (existingData && existingData.length > 0) {
          console.log('Updating existing record:', existingData[0].id);
          result = await supabase
            .from('vendor_guidelines_settings')
            .update(dataToSave)
            .eq('id', existingData[0].id);
        } else {
          console.log('Inserting new record');
          result = await supabase
            .from('vendor_guidelines_settings')
            .insert([dataToSave])
            .select();
        }
      }

      console.log('Supabase result:', result);
      const { error } = result;
      if (error) throw error;

      // Also save footer setting for Vendor Guidelines
      await updateFooterVisibilitySetting({
        vendor_guidelines_visible: footerSettings.vendor_guidelines_visible ?? true,
      });

      console.log('Vendor Guidelines settings saved successfully!');
      toast.success('Vendor Guidelines settings saved successfully!');
      loadAll();
    } catch (error: any) {
      console.error('Error saving vendor guidelines settings:', error);
      toast.error(`Failed to save vendor guidelines settings: ${error.message || 'Unknown error'}`);
    }
  };

  const handleSaveBrowseAllDirectoriesSettings = async () => {
    try {
      console.log('Saving browse all directories settings:', browseAllDirectoriesSettings);

      const dataToSave: any = {
        heading: browseAllDirectoriesSettings.heading,
        updated_at: new Date().toISOString(),
      };

      let result;
      if (browseAllDirectoriesSettings.id) {
        console.log('Updating existing record with id:', browseAllDirectoriesSettings.id);
        result = await supabase
          .from('browse_all_directories_settings')
          .update(dataToSave)
          .eq('id', browseAllDirectoriesSettings.id);
      } else {
        console.log('Checking for existing data...');
        const { data: existingData } = await supabase
          .from('browse_all_directories_settings')
          .select('id')
          .limit(1);
        console.log('existingData:', existingData);

        if (existingData && existingData.length > 0) {
          console.log('Updating existing record:', existingData[0].id);
          result = await supabase
            .from('browse_all_directories_settings')
            .update(dataToSave)
            .eq('id', existingData[0].id);
        } else {
          console.log('Inserting new record');
          result = await supabase
            .from('browse_all_directories_settings')
            .insert([dataToSave])
            .select();
        }
      }

      console.log('Supabase result:', result);
      const { error } = result;
      if (error) throw error;

      // Also save footer setting for Browse All Directories
      await updateFooterVisibilitySetting({
        view_all_categories_visible: footerSettings.view_all_categories_visible ?? true,
      });

      console.log('Browse All Directories settings saved successfully!');
      toast.success('Browse All Directories settings saved successfully!');
      loadAll();
    } catch (error: any) {
      console.error('Error saving browse all directories settings:', error);
      toast.error(`Failed to save browse all directories settings: ${error.message || 'Unknown error'}`);
    }
  };

  const handleSaveAdvertiseCard = async () => {
    if (!editAdvertiseCard) return;
    try {
      console.log('Saving advertise card:', editAdvertiseCard);
      let result;
      if (editAdvertiseCard.id) {
        // Prepare update data without id
        const { id, ...updateData } = editAdvertiseCard;
        result = await supabase
          .from('advertise_cards')
          .update(updateData)
          .eq('id', editAdvertiseCard.id);
      } else {
        const { data: lastCard } = await supabase
          .from('advertise_cards')
          .select('sort_order')
          .order('sort_order', { ascending: false })
          .limit(1);
        const nextSortOrder = lastCard && lastCard.length > 0 ? lastCard[0].sort_order + 1 : 0;
        const newCard = {
          heading: editAdvertiseCard.heading || '',
          description: editAdvertiseCard.description || '',
          logo_url: editAdvertiseCard.logo_url,
          sort_order: nextSortOrder,
          is_visible: true,
        };
        result = await supabase.from('advertise_cards').insert(newCard);
      }

      const { error } = result;
      if (error) throw error;

      console.log('Advertise card saved successfully!');
      setShowAddAdvertiseCardModal(false);
      setEditAdvertiseCard(null);
      toast.success('Advertise card saved!');
      loadAll();
    } catch (error: any) {
      console.error('Error saving advertise card:', error);
      toast.error(`Failed to save advertise card: ${error.message || 'Unknown error'}`);
    }
  };

  const handleDeleteAdvertiseCard = async (id: string) => {
    try {
      await supabase.from('advertise_cards').delete().eq('id', id);
      toast.success('Advertise card deleted!');
      loadAll();
    } catch (error) {
      toast.error('Failed to delete advertise card');
      console.error(error);
    }
  };

  const handleSaveAdvertiseSection = async () => {
    if (!editAdvertiseSection) return;
    try {
      console.log('Saving advertise section:', editAdvertiseSection);
      let result;
      if (editAdvertiseSection.id) {
        // Prepare update data without id
        const { id, ...updateData } = editAdvertiseSection;
        result = await supabase
          .from('advertise_sections')
          .update(updateData)
          .eq('id', editAdvertiseSection.id);
      } else {
        const { data: lastSection } = await supabase
          .from('advertise_sections')
          .select('sort_order')
          .order('sort_order', { ascending: false })
          .limit(1);
        const nextSortOrder = lastSection && lastSection.length > 0 ? lastSection[0].sort_order + 1 : 0;
        const newSection = {
          small_heading: editAdvertiseSection.small_heading || '',
          main_heading: editAdvertiseSection.main_heading || '',
          description: editAdvertiseSection.description || '',
          button_text: editAdvertiseSection.button_text,
          button_link: editAdvertiseSection.button_link,
          button_visible: editAdvertiseSection.button_visible ?? true,
          image_url: editAdvertiseSection.image_url,
          sort_order: nextSortOrder,
          is_visible: true,
        };
        result = await supabase.from('advertise_sections').insert(newSection);
      }

      const { error } = result;
      if (error) throw error;

      console.log('Advertise section saved successfully!');
      setShowAddAdvertiseSectionModal(false);
      setEditAdvertiseSection(null);
      toast.success('Advertise section saved!');
      loadAll();
    } catch (error: any) {
      console.error('Error saving advertise section:', error);
      toast.error(`Failed to save advertise section: ${error.message || 'Unknown error'}`);
    }
  };

  const handleDeleteAdvertiseSection = async (id: string) => {
    try {
      await supabase.from('advertise_sections').delete().eq('id', id);
      toast.success('Advertise section deleted!');
      loadAll();
    } catch (error) {
      toast.error('Failed to delete advertise section');
      console.error(error);
    }
  };

  // Debounce timer for comparison cell updates
  const debounceTimerRef = useRef<Record<string, NodeJS.Timeout | null>>({});

  // Get Listed Page Functions
  const handleSaveGetListedPlan = async () => {
    if (!editGetListedPlan) return;
    try {
      console.log('Saving get listed plan:', editGetListedPlan);
      let result;
      if (editGetListedPlan.id) {
        // Prepare update data without id
        const { id, ...updateData } = editGetListedPlan;
        result = await supabase
          .from('get_listed_plans')
          .update(updateData)
          .eq('id', editGetListedPlan.id);
      } else {
        const { data: lastPlan } = await supabase
          .from('get_listed_plans')
          .select('sort_order')
          .order('sort_order', { ascending: false })
          .limit(1);
        const nextSortOrder = lastPlan && lastPlan.length > 0 ? lastPlan[0].sort_order + 1 : 0;
        const newPlan = {
          plan_name: editGetListedPlan.plan_name || '',
          comparison_header: editGetListedPlan.comparison_header || '',
          price_inr: editGetListedPlan.price_inr || 0,
          price_usd: editGetListedPlan.price_usd || 0,
          duration: editGetListedPlan.duration || '',
          button_text: editGetListedPlan.button_text || '',
          button_link: editGetListedPlan.button_link || '',
          button_link_usd: editGetListedPlan.button_link_usd || '',
          button_visible: editGetListedPlan.button_visible ?? true,
          popular: editGetListedPlan.popular ?? false,
          visible: editGetListedPlan.visible ?? true,
          show_view_more: editGetListedPlan.show_view_more ?? true,
          sort_order: nextSortOrder,
        };
        result = await supabase.from('get_listed_plans').insert(newPlan);
      }

      const { error } = result;
      if (error) throw error;

      console.log('Get listed plan saved successfully!');
      setShowAddGetListedPlanModal(false);
      setEditGetListedPlan(null);
      toast.success('Get listed plan saved!');
      loadAll();
    } catch (error: any) {
      console.error('Error saving get listed plan:', error);
      toast.error(`Failed to save get listed plan: ${error.message || 'Unknown error'}`);
    }
  };

  const handleSaveComparisonHeader = async (planId: string) => {
    try {
      const result = await supabase
        .from('get_listed_plans')
        .update({ comparison_header: editingComparisonHeaderText })
        .eq('id', planId);

      const { error } = result;
      if (error) throw error;

      // Update local state to reflect change immediately
      setGetListedPlans(prev => prev.map(p =>
        p.id === planId ? { ...p, comparison_header: editingComparisonHeaderText } : p
      ));

      setEditingComparisonHeaderPlanId(null);
      setEditingComparisonHeaderText('');
      toast.success('Comparison header saved!');
    } catch (error: any) {
      console.error('Error saving comparison header:', error);
      toast.error(`Failed to save comparison header: ${error.message || 'Unknown error'}`);
    }
  };

  const handleDeleteGetListedPlan = async (id: string) => {
    try {
      await supabase.from('get_listed_plans').delete().eq('id', id);
      toast.success('Get listed plan deleted!');
      loadAll();
    } catch (error) {
      toast.error('Failed to delete get listed plan');
      console.error(error);
    }
  };

  const handleAddGetListedPlanFeature = async (planId: string, featureText: string) => {
    try {
      const { data: lastFeature } = await supabase
        .from('get_listed_plan_features')
        .select('sort_order')
        .eq('plan_id', planId)
        .order('sort_order', { ascending: false })
        .limit(1);
      const nextSortOrder = lastFeature && lastFeature.length > 0 ? lastFeature[0].sort_order + 1 : 0;
      await supabase.from('get_listed_plan_features').insert({
        plan_id: planId,
        feature_text: featureText,
        visible: true,
        sort_order: nextSortOrder,
      });
      toast.success('Feature added!');
      loadAll();
    } catch (error) {
      toast.error('Failed to add feature');
      console.error(error);
    }
  };

  const handleDeleteGetListedPlanFeature = async (id: string) => {
    try {
      await supabase.from('get_listed_plan_features').delete().eq('id', id);
      toast.success('Feature deleted!');
      loadAll();
    } catch (error) {
      toast.error('Failed to delete feature');
      console.error(error);
    }
  };

  const handleUpdateGetListedPlanFeatureText = async (id: string, featureText: string) => {
    try {
      await supabase
        .from('get_listed_plan_features')
        .update({ feature_text: featureText })
        .eq('id', id);
      setGetListedPlanFeatures(prev => prev.map(f => f.id === id ? { ...f, feature_text: featureText } : f));
      setEditingGetListedFeatureId(null);
      setEditingGetListedFeatureText('');
      toast.success('Feature updated!');
    } catch (error: any) {
      const message = error?.message || 'Unknown error';
      toast.error(`Failed to update feature: ${message}`);
      console.error(error);
    }
  };

  const handleToggleGetListedPlanFeatureVisibility = async (id: string, visible: boolean) => {
    try {
      await supabase
        .from('get_listed_plan_features')
        .update({ visible })
        .eq('id', id);
      setGetListedPlanFeatures(prev => prev.map(f => f.id === id ? { ...f, visible } : f));
      toast.success('Feature visibility updated!');
    } catch (error: any) {
      const message = error?.message || 'Unknown error';
      if (typeof message === 'string' && message.toLowerCase().includes('visible')) {
        toast.error('Failed to update: missing database column "visible" in get_listed_plan_features');
      } else {
        toast.error(`Failed to update feature visibility: ${message}`);
      }
      console.error(error);
    }
  };

  const handleToggleGetListedPlanVisibility = async (id: string, visible: boolean) => {
    try {
      const { error } = await supabase
        .from('get_listed_plans')
        .update({ visible })
        .eq('id', id);
      if (error) throw error;
      setGetListedPlans(prev => prev.map(p => p.id === id ? { ...p, visible } : p));
      toast.success('Plan visibility updated!');
    } catch (error: any) {
      const message = error?.message || 'Unknown error';
      if (typeof message === 'string' && message.toLowerCase().includes('visible')) {
        toast.error('Failed to update: missing database column "visible" in get_listed_plans');
      } else {
        toast.error(`Failed to update plan visibility: ${message}`);
      }
      console.error(error);
    }
  };

  const handleToggleComparisonPlanColumnVisibility = async (planId: string, visible: boolean) => {
    setComparisonPlanVisibility(planId, visible);
    setGetListedPlans(prev => prev.map(plan => plan.id === planId ? { ...plan } : plan));
    toast.success('Comparison column visibility updated!');
  };

  const handleSaveGetListedComparisonRow = async () => {
    if (!editGetListedComparisonRow) return;
    try {
      console.log('Saving get listed comparison row:', editGetListedComparisonRow);
      let result;
      if (editGetListedComparisonRow.id) {
        const { id, ...updateData } = editGetListedComparisonRow;
        result = await supabase
          .from('get_listed_comparison_rows')
          .update(updateData)
          .eq('id', editGetListedComparisonRow.id);
      } else {
        const { data: lastRow } = await supabase
          .from('get_listed_comparison_rows')
          .select('sort_order')
          .order('sort_order', { ascending: false })
          .limit(1);
        const nextSortOrder = lastRow && lastRow.length > 0 ? lastRow[0].sort_order + 1 : 0;
        const newRow = {
          row_title: editGetListedComparisonRow.row_title || '',
          visible: editGetListedComparisonRow.visible ?? true,
          sort_order: nextSortOrder,
        };
        result = await supabase.from('get_listed_comparison_rows').insert(newRow);
      }
      const { error } = result;
      if (error) throw error;

      console.log('Get listed comparison row saved successfully!');
      setShowAddGetListedComparisonRowModal(false);
      setEditGetListedComparisonRow(null);
      toast.success('Comparison row saved!');
      loadAll();
    } catch (error: any) {
      console.error('Error saving get listed comparison row:', error);
      toast.error(`Failed to save comparison row: ${error.message || 'Unknown error'}`);
    }
  };

  const handleDeleteGetListedComparisonRow = async (id: string) => {
    try {
      await supabase.from('get_listed_comparison_rows').delete().eq('id', id);
      toast.success('Comparison row deleted!');
      loadAll();
    } catch (error) {
      toast.error('Failed to delete comparison row');
      console.error(error);
    }
  };

  const handleSaveGetListedSettings = async () => {
    try {
      console.log('handleSaveGetListedSettings called, current state:', getListedSettings);
      if (!getListedSettings.id) {
        // Create new settings if not exists
        const newSettings = {
          main_heading: getListedSettings.main_heading,
          comparison_heading: getListedSettings.comparison_heading,
          comparison_footer_content: getListedSettings.comparison_footer_content,
          comparison_footer_line: getListedSettings.comparison_footer_line,
          show_currency_toggle: getListedSettings.show_currency_toggle ?? true,
          show_pricing_section: getListedSettings.show_pricing_section ?? true,
          show_comparison_section: getListedSettings.show_comparison_section ?? true,
          show_comparison_footer: getListedSettings.show_comparison_footer ?? true,
        };
        const insertResult = await supabase.from('get_listed_settings').insert(newSettings).select();
        console.log('Insert result:', insertResult);
        if (insertResult.data && insertResult.data.length > 0) {
          setGetListedSettings(insertResult.data[0] as any);
        }
      } else {
        const updateResult = await supabase
          .from('get_listed_settings')
          .update({
            main_heading: getListedSettings.main_heading,
            comparison_heading: getListedSettings.comparison_heading,
            comparison_footer_content: getListedSettings.comparison_footer_content,
            comparison_footer_line: getListedSettings.comparison_footer_line,
            show_currency_toggle: getListedSettings.show_currency_toggle ?? true,
            show_pricing_section: getListedSettings.show_pricing_section ?? true,
            show_comparison_section: getListedSettings.show_comparison_section ?? true,
            show_comparison_footer: getListedSettings.show_comparison_footer ?? true,
          })
          .eq('id', getListedSettings.id)
          .select();
        console.log('Update result:', updateResult);
        if (updateResult.data && updateResult.data.length > 0) {
          setGetListedSettings(updateResult.data[0] as any);
        }
      }

      // Also save footer setting for Get Listed
      await updateFooterVisibilitySetting({
        get_listed_visible: footerSettings.get_listed_visible ?? true,
      });

      const latestSettingsResult = await supabase
        .from('get_listed_settings')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (latestSettingsResult.data) {
        setGetListedSettings(latestSettingsResult.data as any);
      }
      toast.success('Get Listed settings saved!');
      // Do NOT call loadAll() to prevent race conditions - we've already updated state with latest data!
    } catch (error: any) {
      const message = error?.message || 'Unknown error';
      if (typeof message === 'string' && message.toLowerCase().includes('comparison_footer_content')) {
        toast.error('Failed to save: missing database column "comparison_footer_content" in get_listed_settings');
      } else if (typeof message === 'string' && message.toLowerCase().includes('comparison_footer_line')) {
        toast.error('Failed to save: missing database column "comparison_footer_line" in get_listed_settings');
      } else {
        toast.error(`Failed to save Get Listed settings: ${message}`);
      }
      console.error('Error saving get listed settings:', error);
    }
  };

  const handleUpdateGetListedComparisonCell = async (rowId: string, planId: string, tickEnabled: boolean, customText: string, showToast: boolean = true) => {
    try {
      // Check if cell already exists
      const { data: existingCell } = await supabase
        .from('get_listed_comparison_cells')
        .select('*')
        .eq('row_id', rowId)
        .eq('plan_id', planId)
        .maybeSingle();

      if (existingCell) {
        await supabase
          .from('get_listed_comparison_cells')
          .update({
            tick_enabled: tickEnabled,
            custom_text: customText,
          })
          .eq('id', existingCell.id);
      } else {
        await supabase.from('get_listed_comparison_cells').insert({
          row_id: rowId,
          plan_id: planId,
          tick_enabled: tickEnabled,
          custom_text: customText,
        });
      }
      if (showToast) {
        toast.success('Comparison cell updated!');
      }
      loadAll();
    } catch (error) {
      if (showToast) {
        toast.error('Failed to update comparison cell');
      }
      console.error(error);
    }
  };

  function getSectionDisplayName(section: PageSection | undefined) {
    if (!section) return '';
    return section.name || section.heading?.trim() || section.section_type;
  }

  async function handleSectionDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const activeSection = sections.find(s => s.id === active.id);
    const overSection = sections.find(s => s.id === over.id);
    if (!activeSection || !overSection) return;
    if (activeSection.is_locked || overSection.is_locked) return;

    const oldIndex = sections.findIndex(s => s.id === active.id);
    const newIndex = sections.findIndex(s => s.id === over.id);
    const newSections = arrayMove(sections, oldIndex, newIndex).map((s, i) => ({ ...s, sort_order: i }));
    setSections(newSections);
    for (const s of newSections) {
      await updateSortOrder(s.id, s.sort_order);
    }
    toast.success('Section order saved!');
  }

  const selectedOffers = selectedOffersSectionId
    ? offers.filter((o) => o.section_id === selectedOffersSectionId).sort((a, b) => a.sort_order - b.sort_order)
    : [];
  const offersFixedModeEnabled = selectedOffers.some((o) => o.is_fixed);

  const selectedCards = selectedCardsSectionId
    ? cards.filter((c) => c.section_id === selectedCardsSectionId).sort((a, b) => a.sort_order - b.sort_order)
    : [];
  const cardsFixedModeEnabled = selectedCards.some((c) => c.is_fixed);

  const selectedAds2 = selectedAds2SectionId
    ? ads2.filter((a) => a.section_id === selectedAds2SectionId).sort((a, b) => a.sort_order - b.sort_order)
    : [];
  const ads2FixedModeEnabled = selectedAds2.some((a) => a.is_fixed);

  const selectedAds3 = selectedAds3SectionId
    ? ads3.filter((a) => a.section_id === selectedAds3SectionId).sort((a, b) => a.sort_order - b.sort_order)
    : [];
  const ads3FixedModeEnabled = selectedAds3.some((a) => a.is_fixed);

  const selectedAds1 = selectedAds1SectionId
    ? ads2.filter((a) => a.section_id === selectedAds1SectionId).sort((a, b) => a.sort_order - b.sort_order)
    : [];
  const ads1FixedModeEnabled = selectedAds1.some((a) => a.is_fixed);
  const selectedCategories = selectedCategoriesSectionId
    ? categories.filter((c) => c.section_id === selectedCategoriesSectionId).sort((a, b) => a.sort_order - b.sort_order)
    : [];

  async function handleOfferDragEnd(event: DragEndEvent) {
    if (!offersFixedModeEnabled) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = selectedOffers.findIndex((offer) => offer.id === active.id);
    const newIndex = selectedOffers.findIndex((offer) => offer.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const newOrder = arrayMove(selectedOffers, oldIndex, newIndex).map((offer, index) => ({ ...offer, sort_order: index }));
    setOffers((prev) => prev.map((offer) => {
      const updated = newOrder.find((item) => item.id === offer.id);
      return updated ? updated : offer;
    }));

    for (const offer of newOrder) {
      await updateOfferSortOrder(offer.id, offer.sort_order);
    }

    toast.success('Offer order saved!');
  }

  async function handleCardDragEnd(event: DragEndEvent) {
    if (!cardsFixedModeEnabled) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = selectedCards.findIndex((card) => card.id === active.id);
    const newIndex = selectedCards.findIndex((card) => card.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const newOrder = arrayMove(selectedCards, oldIndex, newIndex).map((card, index) => ({ ...card, sort_order: index }));
    setCards((prev) => prev.map((card) => {
      const updated = newOrder.find((item) => item.id === card.id);
      return updated ? updated : card;
    }));

    for (const card of newOrder) {
      await updateCardSortOrder(card.id, card.sort_order);
    }

    toast.success('Card order saved!');
  }

  // Functions for managing multiple About sections
  const addAboutSection = (subcategoryId: string) => {
    const newSection: SubcategoryAboutSection = {
      id: `temp-${crypto.randomUUID()}`,
      subcategory_id: subcategoryId,
      heading: 'About',
      content: '',
      background_color: '#ffffff',
      heading_color: '#000000',
      sort_order: (editAboutSections[subcategoryId] || []).length,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setEditAboutSections(prev => ({
      ...prev,
      [subcategoryId]: [...(prev[subcategoryId] || []), newSection]
    }));
  };

  const updateAboutSection = useCallback((subcategoryId: string, sectionId: string, updates: Partial<SubcategoryAboutSection>) => {
    setEditAboutSections(prev => ({
      ...prev,
      [subcategoryId]: (prev[subcategoryId] || []).map(section =>
        section.id === sectionId ? { ...section, ...updates } : section
      )
    }));
  }, []);

  // Create a stable onChange handler for each section to prevent re-renders
  const createAboutSectionChangeHandler = useCallback((subcategoryId: string, sectionId: string) => {
    return (value: string) => {
      updateAboutSection(subcategoryId, sectionId, { content: value });
    };
  }, [updateAboutSection]);

  const deleteAboutSection = async (subcategoryId: string, sectionId: string) => {
    if (!window.confirm('Delete this About section?')) return;

    try {
      await supabase.from('subcategory_about_sections' as any).delete().eq('id', sectionId);
      setEditAboutSections(prev => ({
        ...prev,
        [subcategoryId]: (prev[subcategoryId] || []).filter(section => section.id !== sectionId)
      }));
      toast.success('About section deleted.');
    } catch (error) {
      console.error('Error deleting about section:', error);
      toast.error('Failed to delete about section.');
    }
  };

  // Functions for managing multiple Key Features sections
  const addKeyFeaturesSection = (subcategoryId: string) => {
    const newSection: SubcategoryKeyFeaturesSection = {
      id: `temp-${crypto.randomUUID()}`,
      subcategory_id: subcategoryId,
      heading: 'Key Features',
      is_visible: true,
      sort_order: (editKeyFeaturesSections[subcategoryId] || []).length,
    };

    setEditKeyFeaturesSections(prev => ({
      ...prev,
      [subcategoryId]: [...(prev[subcategoryId] || []), newSection]
    }));
  };

  const updateKeyFeaturesSection = (subcategoryId: string, sectionId: string, updates: Partial<SubcategoryKeyFeaturesSection>) => {
    setEditKeyFeaturesSections(prev => ({
      ...prev,
      [subcategoryId]: (prev[subcategoryId] || []).map(section =>
        section.id === sectionId ? { ...section, ...updates } : section
      )
    }));
  };

  const deleteKeyFeaturesSection = async (subcategoryId: string, sectionId: string) => {
    if (!window.confirm('Delete this Key Features section?')) return;

    setEditKeyFeaturesSections(prev => ({
      ...prev,
      [subcategoryId]: (prev[subcategoryId] || []).filter(section => section.id !== sectionId)
    }));
    // Associated points will be filtered out by UI and re-saved correctly
  };

  const saveKeyFeaturesSections = async (subcategoryId: string, points: SubcategoryOverviewPoint[]) => {
    const sections = editKeyFeaturesSections[subcategoryId] || [];

    try {
      // Clear existing sections and points for this subcategory
      // Points will be deleted by cascade when sections are deleted, but we also delete points without sections
      await supabase.from('subcategory_overview_points' as any).delete().eq('subcategory_id', subcategoryId);
      await supabase.from('subcategory_key_features_sections' as any).delete().eq('subcategory_id', subcategoryId);

      for (let i = 0; i < sections.length; i++) {
        const section = sections[i];
        const { data: newSection, error: sectionError } = await supabase
          .from('subcategory_key_features_sections' as any)
          .insert({
            subcategory_id: subcategoryId,
            heading: section.heading || 'Key Features',
            is_visible: section.is_visible,
            sort_order: section.sort_order,
          })
          .select()
          .single();

        if (sectionError) throw sectionError;

        const sectionPoints = points.filter(p => p.section_id === section.id);
        if (sectionPoints.length > 0) {
          const pointsToInsert = sectionPoints.map((p, idx) => ({
            subcategory_id: subcategoryId,
            section_id: (newSection as any).id,
            text: p.text.trim(),
            is_highlighted: p.is_highlighted,
            highlight_color: p.highlight_color || 'green',
            sort_order: idx,
          }));
          const { error: pointsError } = await supabase.from('subcategory_overview_points' as any).insert(pointsToInsert);
          if (pointsError) throw pointsError;
        }
      }
    } catch (error) {
      console.error('Error saving key features sections:', error);
      throw error;
    }
  };

  const saveAboutSections = async (subcategoryId: string) => {
    const sections = editAboutSections[subcategoryId] || [];
    console.log('Saving About Sections for subcategory:', subcategoryId, 'Sections:', sections);

    try {
      // Clear existing sections for this subcategory
      const { error: deleteError } = await supabase.from('subcategory_about_sections' as any).delete().eq('subcategory_id', subcategoryId);
      if (deleteError) {
        console.error('Error deleting existing about sections:', deleteError);
        throw deleteError;
      }

      // Insert updated sections - save all sections
      const sectionsToInsert = sections.map((section, index) => ({
        id: section.id.startsWith('temp-') ? crypto.randomUUID() : section.id,
        subcategory_id: subcategoryId,
        heading: section.heading || '',
        content: section.content || '',
        background_color: section.background_color || '#ffffff',
        heading_color: section.heading_color || '#000000',
        sort_order: index,
        is_visible: editAboutSectionVisibility[subcategoryId]?.[section.id] ?? true,
      }));

      console.log('Sections to insert:', sectionsToInsert);

      if (sectionsToInsert.length > 0) {
        const { error: insertError } = await supabase.from('subcategory_about_sections' as any).insert(sectionsToInsert);
        if (insertError) {
          console.error('Error inserting about sections:', insertError);
          throw insertError;
        }
      }

      console.log('About Sections saved successfully for subcategory:', subcategoryId);
    } catch (error) {
      console.error('Error saving about sections:', error);
      toast.error('Failed to save about sections.');
      throw error; // Re-throw to ensure saveCategory knows about the error
    }
  };

  const handleAboutSectionDragEnd = (subcategoryId: string) => (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const sections = editAboutSections[subcategoryId] || [];
    const oldIndex = sections.findIndex((section) => section.id === active.id);
    const newIndex = sections.findIndex((section) => section.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const newOrder = arrayMove(sections, oldIndex, newIndex).map((section, index) => ({ ...section, sort_order: index }));
    setEditAboutSections(prev => ({
      ...prev,
      [subcategoryId]: newOrder
    }));
  };

  async function handleAds2DragEnd(event: DragEndEvent) {
    if (!ads2FixedModeEnabled) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = selectedAds2.findIndex((ad) => ad.id === active.id);
    const newIndex = selectedAds2.findIndex((ad) => ad.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const newOrder = arrayMove(selectedAds2, oldIndex, newIndex).map((ad, index) => ({ ...ad, sort_order: index }));
    setAds2((prev) => prev.map((ad) => {
      const updated = newOrder.find((item) => item.id === ad.id);
      return updated ? updated : ad;
    }));

    for (const ad of newOrder) {
      await updateAds2SortOrder(ad.id, ad.sort_order);
    }

    toast.success('Ad order saved!');
  }

  async function handleAds1DragEnd(event: DragEndEvent) {
    if (!ads1FixedModeEnabled) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = selectedAds1.findIndex((ad) => ad.id === active.id);
    const newIndex = selectedAds1.findIndex((ad) => ad.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const newOrder = arrayMove(selectedAds1, oldIndex, newIndex).map((ad, index) => ({ ...ad, sort_order: index }));
    setAds2((prev) => prev.map((ad) => {
      const updated = newOrder.find((item) => item.id === ad.id);
      return updated ? updated : ad;
    }));

    for (const ad of newOrder) {
      await updateAds2SortOrder(ad.id, ad.sort_order);
    }

    toast.success('Ad order saved!');
  }

  async function handleAds3DragEnd(event: DragEndEvent) {
    if (!ads3FixedModeEnabled) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = selectedAds3.findIndex((ad) => ad.id === active.id);
    const newIndex = selectedAds3.findIndex((ad) => ad.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const newOrder = arrayMove(selectedAds3, oldIndex, newIndex).map((ad, index) => ({ ...ad, sort_order: index }));
    setAds3((prev) => prev.map((ad) => {
      const updated = newOrder.find((item) => item.id === ad.id);
      return updated ? updated : ad;
    }));

    for (const ad of newOrder) {
      await updateAds3SortOrder(ad.id, ad.sort_order);
    }

    toast.success('Ad order saved!');
  }

  function handleSubcategoryDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = editSubs.findIndex((sub) => sub.id === active.id);
    const newIndex = editSubs.findIndex((sub) => sub.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const newOrder = arrayMove(editSubs, oldIndex, newIndex).map((sub, index) => ({
      ...sub,
      sort_order: index,
    }));

    setEditSubs(newOrder);
  }

  function handleBrandDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = editSubBrands.findIndex((brand) => brand.id === active.id);
    const newIndex = editSubBrands.findIndex((brand) => brand.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const newOrder = arrayMove(editSubBrands, oldIndex, newIndex).map((brand, index) => ({
      ...brand,
      sort_order: index,
    }));

    setEditSubBrands(newOrder);
  }

  async function handleCategoryDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = selectedCategories.findIndex((category) => category.id === active.id);
    const newIndex = selectedCategories.findIndex((category) => category.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const newOrder = arrayMove(selectedCategories, oldIndex, newIndex).map((category, index) => ({
      ...category,
      sort_order: index,
    }));

    setCategories((prev) => prev.map((category) => {
      const updated = newOrder.find((item) => item.id === category.id);
      return updated ? updated : category;
    }));

    for (const category of newOrder) {
      await updateCategorySortOrder(category.id, category.sort_order);
    }

    toast.success('Category order saved!');
  }

  async function saveHero() {
    const wordItems = heroWords
      .map((word, index) => ({
        word: word.trim(),
        visible: heroAnimatedWordVisibility[index] ?? true,
      }))
      .filter((item) => Boolean(item.word));
    const words = wordItems.map((item) => item.word);
    const animatedWordVisibility = wordItems.map((item) => item.visible);
    console.log('Saving hero with words:', words);
    const { data } = await supabase.from('hero_settings').select('id').limit(1).single();
    // Store parts using ||| as delimiter, or original main_text for backward compatibility
    const mainTextValue = heroTextPart1 || heroTextPart2
      ? `${heroTextPart1}|||${heroTextPart2}`
      : '';
    if (data) {
      const { error } = await supabase.from('hero_settings').update({
        main_text: mainTextValue,
        animated_words: words,
        animated_word_visibility: animatedWordVisibility,
        hero_visible: heroVisible,
        hero_text_part1_visible: heroTextPart1Visible,
        hero_text_part2_visible: heroTextPart2Visible,
        hero_animated_words_visible: heroAnimatedWordsVisible,
        hero_search_visible: heroSearchVisible,
      }).eq('id', data.id);
      if (error) {
        console.error('Error saving hero:', error);
        toast.error('Failed to save hero');
        return;
      }
    }
    toast.success('Hero saved!');
    await loadAll();
  }

  async function saveCard() {
    if (!editCard) return;
    if (!editCard.title?.trim() || !editCard.description?.trim()) {
      toast.error('Title and description are required.');
      return;
    }
    try {
      if (editCard.id) {
        const updateData: any = {
          title: editCard.title.trim(),
          description: editCard.description.trim(),
          logo_url: editCard.logo_url,
          link: editCard.link || null,
          show_border: editCard.show_border ?? false,
          border_color: editCard.border_color ?? null,
          background_color: editCard.background_color ?? null,
          open_in_new_tab: editCard.open_in_new_tab ?? false
        };
        if (cardsFixedModeEnabled !== undefined) {
          updateData.is_fixed = cardsFixedModeEnabled;
        }
        const { error } = await supabase.from('featured_cards').update(updateData).eq('id', editCard.id);
        if (error) throw error;
      } else {
        const insertData: any = {
          title: editCard.title.trim(),
          description: editCard.description.trim(),
          logo_url: editCard.logo_url,
          link: editCard.link || null,
          show_border: editCard.show_border ?? false,
          border_color: editCard.border_color ?? null,
          background_color: editCard.background_color ?? null,
          open_in_new_tab: editCard.open_in_new_tab ?? false,
          sort_order: cards.length,
          section_id: selectedCardsSectionId
        };
        if (cardsFixedModeEnabled !== undefined) {
          insertData.is_fixed = cardsFixedModeEnabled;
        }
        const { error } = await supabase.from('featured_cards').insert(insertData);
        if (error) throw error;
      }
      setEditCard(null);
      loadAll();
      toast.success('Card saved!');
    } catch (error) {
      console.error('Error saving card:', error instanceof Error ? error.message : JSON.stringify(error));
      toast.error('Failed to save card. Check console for details.');
    }
  }

  async function deleteCard(id: string) {
    try {
      const { error } = await supabase.from('featured_cards').delete().eq('id', id);
      if (error) throw error;
      loadAll();
      toast.success('Deleted!');
    } catch (error) {
      console.error('Error deleting card:', error instanceof Error ? error.message : JSON.stringify(error));
      toast.error('Failed to delete card.');
    }
  }

  async function updateOfferSortOrder(offerId: string, newOrder: number) {
    try {
      const { error } = await supabase.from('offers').update({ sort_order: newOrder }).eq('id', offerId);
      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Error updating offer order:', err instanceof Error ? err.message : JSON.stringify(err));
      toast.error('Failed to save offer order.');
      return false;
    }
  }

  async function updateCardSortOrder(cardId: string, newOrder: number) {
    try {
      const { error } = await supabase.from('featured_cards').update({ sort_order: newOrder }).eq('id', cardId);
      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Error updating card order:', err instanceof Error ? err.message : JSON.stringify(err));
      toast.error('Failed to save card order.');
      return false;
    }
  }

  async function updateAds2SortOrder(adId: string, newOrder: number) {
    try {
      const { error } = await supabase.from('ads_2col').update({ sort_order: newOrder }).eq('id', adId);
      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Error updating ad order:', err instanceof Error ? err.message : JSON.stringify(err));
      toast.error('Failed to save ad order.');
      return false;
    }
  }

  function startNewFaq(parentId: string | null = null) {
    setEditFaq({
      question: '',
      answer: '',
      parent_id: parentId,
      is_visible: true,
      sort_order: 0,
    });
    setShowAddFaqModal(true);
  }

  function startEditFaq(faq: FAQ) {
    setEditFaq({ ...faq, answer: faq.answer ?? '' });
    setShowAddFaqModal(true);
  }

  async function saveFaq() {
    if (!editFaq) return;
    if (!editFaq.question?.trim()) {
      toast.error('Question is required.');
      return;
    }

    const isSubFaq = Boolean(editFaq.parent_id);
    if (isSubFaq && !editFaq.answer?.trim()) {
      toast.error('Answer is required for sub FAQs.');
      return;
    }

    try {
      const payload = {
        question: editFaq.question.trim(),
        answer: editFaq.answer?.trim() || null,
        is_visible: editFaq.is_visible ?? true,
        updated_at: new Date().toISOString(),
      };

      if (editFaq.id) {
        const { error } = await supabase
          .from('faqs')
          .update(payload)
          .eq('id', editFaq.id);
        if (error) throw error;
      } else {
        const baseFaqs = faqs.filter((item) => (editFaq.parent_id ? item.parent_id === editFaq.parent_id : item.parent_id == null));
        const nextOrder = baseFaqs.length;
        const { error } = await supabase.from('faqs').insert({
          ...payload,
          parent_id: editFaq.parent_id ?? null,
          sort_order: nextOrder,
        });
        if (error) throw error;
      }
      toast.success('FAQ saved!');
      setEditFaq(null);
      setShowAddFaqModal(false);
      await loadAll();
    } catch (err) {
      console.error('Error saving FAQ:', err instanceof Error ? err.message : JSON.stringify(err));
      toast.error('Failed to save FAQ.');
    }
  }

  async function deleteFaq(id: string) {
    try {
      const { error: deleteChildrenError } = await supabase.from('faqs').delete().eq('parent_id', id);
      if (deleteChildrenError) throw deleteChildrenError;
      const { error } = await supabase.from('faqs').delete().eq('id', id);
      if (error) throw error;
      toast.success('FAQ deleted!');
      await loadAll();
    } catch (err) {
      console.error('Error deleting FAQ:', err instanceof Error ? err.message : JSON.stringify(err));
      toast.error('Failed to delete FAQ.');
    }
  }

  async function updateFaqSortOrder(faqId: string, newOrder: number) {
    try {
      const { error } = await supabase.from('faqs').update({ sort_order: newOrder }).eq('id', faqId);
      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Error updating FAQ order:', err instanceof Error ? err.message : JSON.stringify(err));
      toast.error('Failed to save FAQ order.');
      return false;
    }
  }

  function stripHtml(html: string | null | undefined): string {
    if (!html) return '';
    const temp = document.createElement('div');
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || '';
  }

  // Product Tab Sections helper functions for Edit Subcategory view
  const db = supabase as any;

  const loadProductSectionContent = useCallback(async (subcategoryId: string) => {
    const sectionIds = productSections.map((section) => section.id);

    if (sectionIds.length === 0) {
      setProductCards([]);
      setProductOffers([]);
      setProductAds2([]);
      setProductAds3([]);
      return;
    }

    const [{ data: cardsData }, { data: offersData }, { data: ads2Data }, { data: ads3Data }] = await Promise.all([
      db.from(PRODUCT_CARDS_TABLE).select('*').in('section_id', sectionIds).order('sort_order'),
      db.from(PRODUCT_OFFERS_TABLE).select('*').in('section_id', sectionIds).order('sort_order'),
      db.from(PRODUCT_ADS_2_TABLE).select('*').in('section_id', sectionIds).order('sort_order'),
      db.from(PRODUCT_ADS_3_TABLE).select('*').in('section_id', sectionIds).order('sort_order'),
    ]);

    setProductCards(((cardsData || []) as FeaturedCardItem[]).map((card) => ({ ...card, link: card.link ?? null, is_fixed: card.is_fixed ?? false, show_border: card.show_border ?? false, border_color: card.border_color ?? null })));
    setProductOffers(((offersData || []) as OfferItem[]).map((offer) => ({ ...offer, link: offer.link ?? null, is_fixed: offer.is_fixed ?? false, show_border: offer.show_border ?? false, border_color: offer.border_color ?? null, background_color: offer.background_color ?? null, show_image: offer.show_image ?? true })));
    setProductAds2(((ads2Data || []) as Ad2Item[]).map((ad) => ({ ...ad, link: ad.link ?? null, is_fixed: ad.is_fixed ?? false, show_border: ad.show_border ?? false, border_color: ad.border_color ?? null, background_color: ad.background_color ?? null, show_image: ad.show_image ?? true })));
    setProductAds3(((ads3Data || []) as Ad3Item[]).map((ad) => ({ ...ad, link: ad.link ?? null, is_fixed: ad.is_fixed ?? false, show_border: ad.show_border ?? false, border_color: ad.border_color ?? null, background_color: ad.background_color ?? null, show_image: ad.show_image ?? true })));
  }, [productSections]);

  const productOpenAddSectionModal = (sectionType: ProductAdminTab = 'cards') => {
    setProductAddSectionType(sectionType);
    setProductAddSectionName('');
    setProductShowAddSectionModal(true);
  };

  const productHandleAddSection = async (subcategoryId: string) => {
    const sectionType = productAddSectionType === 'layout' ? 'cards' : productAddSectionType;
    try {
      const newSection = await addProductSection(sectionType, productAddSectionName.trim() || undefined);
      setProductShowAddSectionModal(false);
      if (newSection?.id) {
        if (sectionType === 'cards') setProductSelectedCardsSectionId(newSection.id);
        if (sectionType === 'offers') setProductSelectedOffersSectionId(newSection.id);
        if (sectionType === 'ads_1col') setProductSelectedAds1SectionId(newSection.id);
        if (sectionType === 'ads_2col') setProductSelectedAds2SectionId(newSection.id);
        if (sectionType === 'ads_3col') setProductSelectedAds3SectionId(newSection.id);
      }
      toast.success('Section added.');
      await loadProductSectionContent(subcategoryId);
    } catch (error) {
      console.error('Error adding product section:', error);
      toast.error('Failed to add section.');
    }
  };

  const productOpenHeadingModal = (sectionId: string, productSections: ScopedPageSection[]) => {
    const section = productSections.find((item) => item.id === sectionId);
    if (!section) return;
    setProductHeadingModalSectionId(sectionId);
    setProductHeadingModalValue(section.heading || section.name);
    setProductHeadingVisible(section.show_heading !== false);
    setProductHeadingBackgroundColor(section.background_color || '');
  };

  const productSaveHeadingModal = async (sectionId: string, subcategoryId: string) => {
    if (!productHeadingModalSectionId) return;

    try {
      await updateProductSection(productHeadingModalSectionId, {
        heading: productHeadingModalValue.trim(),
        show_heading: productHeadingVisible,
        background_color: productHeadingBackgroundColor || null,
      });
      setProductHeadingModalSectionId('');
      toast.success('Section updated.');
    } catch (error) {
      console.error('Error saving section heading:', error);
      toast.error('Failed to update section.');
    }
  };

  const productToggleSectionVisibility = async (sectionId: string, visible: boolean, subcategoryId: string) => {
    try {
      await updateProductSection(sectionId, { is_visible: visible });
    } catch (error) {
      console.error('Error toggling section visibility:', error);
      toast.error('Failed to update visibility.');
    }
  };

  const productDeleteSection = async (sectionId: string, subcategoryId: string) => {
    if (!window.confirm('Delete this section and its items?')) return;
    try {
      await deleteProductSection(sectionId);
      toast.success('Section deleted.');
      await loadProductSectionContent(subcategoryId);
    } catch (error) {
      console.error('Error deleting product section:', error);
      toast.error('Failed to delete section.');
    }
  };

  const productUpdateSectionOrder = async (orderedSections: ScopedPageSection[]) => {
    const updates = orderedSections.map((section, index) =>
      db.from(PRODUCT_SECTION_TABLE).update({ sort_order: index }).eq('id', section.id)
    );
    const results = await Promise.all(updates);
    const failed = results.find((result) => result.error);
    if (failed?.error) throw failed.error;
    void refetchProductSections();
    toast.success('Section order saved.');
  };

  const productHandleSectionDragEnd = async (event: DragEndEvent, currentSections: ScopedPageSection[], subcategoryId: string) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = currentSections.findIndex((section) => section.id === active.id);
    const newIndex = currentSections.findIndex((section) => section.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(currentSections, oldIndex, newIndex);
    setProductSectionsLocal(reordered);
    try {
      await productUpdateSectionOrder(reordered);
    } catch (error) {
      console.error('Error updating section order:', error);
      toast.error('Failed to save section order.');
      await refetchProductSections();
    }
  };

  const productUpdateItemOrder = async (tableName: string, items: { id: string }[]) => {
    for (const [index, item] of items.entries()) {
      await db.from(tableName).update({ sort_order: index }).eq('id', item.id);
    }
  };

  const productCreateItemDragHandler = (
    items: { id: string; sort_order: number }[],
    tableName: string,
    enabled: boolean
  ) => {
    return async (event: DragEndEvent) => {
      if (!enabled) return;
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = arrayMove(items, oldIndex, newIndex);
      await productUpdateItemOrder(tableName, reordered);
      toast.success('Item order saved.');
    };
  };

  const productToggleFixedMode = async (tableName: string, sectionId: string, enabled: boolean, subcategoryId: string) => {
    try {
      await db.from(tableName).update({ is_fixed: enabled }).eq('section_id', sectionId);
      await loadProductSectionContent(subcategoryId);
      toast.success(`Fixed mode ${enabled ? 'enabled' : 'disabled'}.`);
    } catch (error) {
      console.error('Error toggling fixed mode:', error);
      toast.error('Failed to update fixed mode.');
    }
  };

  const productSaveCard = async (subcategoryId: string) => {
    if (!productEditCard?.title?.trim() || !productEditCard.description?.trim() || !productSelectedCardsSectionId) {
      toast.error('Title, description, and section are required.');
      return;
    }

    const selectedCards = productCards.filter((card) => card.section_id === productSelectedCardsSectionId).sort((a, b) => a.sort_order - b.sort_order);
    const cardsFixedModeEnabled = selectedCards.some((card) => card.is_fixed);

    try {
      if (productEditCard.id) {
        await db
          .from(PRODUCT_CARDS_TABLE)
          .update({
            title: productEditCard.title.trim(),
            description: productEditCard.description.trim(),
            logo_url: productEditCard.logo_url || null,
            link: productEditCard.link || null,
            show_border: productEditCard.show_border ?? false,
            border_color: productEditCard.border_color ?? null,
            background_color: productEditCard.background_color ?? null,
            is_fixed: cardsFixedModeEnabled,
          })
          .eq('id', productEditCard.id);
      } else {
        await db.from(PRODUCT_CARDS_TABLE).insert({
          title: productEditCard.title.trim(),
          description: productEditCard.description.trim(),
          logo_url: productEditCard.logo_url || null,
          link: productEditCard.link || null,
          show_border: productEditCard.show_border ?? false,
          border_color: productEditCard.border_color ?? null,
          background_color: productEditCard.background_color ?? null,
          sort_order: selectedCards.length,
          section_id: productSelectedCardsSectionId,
          is_fixed: cardsFixedModeEnabled,
        });
      }

      setProductEditCard(null);
      await loadProductSectionContent(subcategoryId);
      toast.success('Card saved.');
    } catch (error) {
      console.error('Error saving card:', error);
      toast.error('Failed to save card.');
    }
  };

  const productSaveOffer = async (subcategoryId: string) => {
    const hasOfferContent =
      Boolean(productEditOffer?.image_url) ||
      Boolean(productEditOffer?.heading?.trim()) ||
      Boolean(productEditOffer?.description?.trim());

    if (!hasOfferContent || !productSelectedOffersSectionId) {
      toast.error('Add an image, heading, or description.');
      return;
    }

    const selectedOffers = productOffers.filter((offer) => offer.section_id === productSelectedOffersSectionId).sort((a, b) => a.sort_order - b.sort_order);
    const offersFixedModeEnabled = selectedOffers.some((offer) => offer.is_fixed);

    try {
      if (productEditOffer.id) {
        await db
          .from(PRODUCT_OFFERS_TABLE)
          .update({
            heading: productEditOffer.heading?.trim() || '',
            description: productEditOffer.description || null,
            image_url: productEditOffer.image_url || null,
            link: productEditOffer.link || null,
            show_border: productEditOffer.show_border ?? false,
            border_color: productEditOffer.border_color ?? null,
            background_color: productEditOffer.background_color ?? null,
            show_image: productEditOffer.show_image ?? true,
            is_fixed: offersFixedModeEnabled,
          })
          .eq('id', productEditOffer.id);
      } else {
        await db.from(PRODUCT_OFFERS_TABLE).insert({
          heading: productEditOffer.heading?.trim() || '',
          description: productEditOffer.description || null,
          image_url: productEditOffer.image_url || null,
          link: productEditOffer.link || null,
          show_border: productEditOffer.show_border ?? false,
          border_color: productEditOffer.border_color ?? null,
          background_color: productEditOffer.background_color ?? null,
          show_image: productEditOffer.show_image ?? true,
          sort_order: selectedOffers.length,
          section_id: productSelectedOffersSectionId,
          is_fixed: offersFixedModeEnabled,
        });
      }

      setProductEditOffer(null);
      await loadProductSectionContent(subcategoryId);
      toast.success('Offer saved.');
    } catch (error) {
      console.error('Error saving offer:', error);
      toast.error('Failed to save offer.');
    }
  };

  const productSaveAd1 = async (subcategoryId: string) => {
    if (!productSelectedAds1SectionId) {
      toast.error('Please select an Ad 1 section.');
      return;
    }

    const selectedAds1 = productAds2.filter((ad) => ad.section_id === productSelectedAds1SectionId).sort((a, b) => a.sort_order - b.sort_order);
    const ads1FixedModeEnabled = selectedAds1.some((ad) => ad.is_fixed);

    try {
      if (productEditAd1?.id) {
        await db
          .from(PRODUCT_ADS_2_TABLE)
          .update({
            image_url: productEditAd1.image_url || null,
            link: productEditAd1.link || null,
            show_border: productEditAd1.show_border ?? false,
            border_color: productEditAd1.border_color ?? null,
            background_color: productEditAd1.background_color ?? null,
            show_image: productEditAd1.show_image ?? true,
            is_fixed: ads1FixedModeEnabled,
          })
          .eq('id', productEditAd1.id);
      } else {
        await db.from(PRODUCT_ADS_2_TABLE).insert({
          image_url: productEditAd1?.image_url || null,
          link: productEditAd1?.link || null,
          show_border: productEditAd1?.show_border ?? false,
          border_color: productEditAd1?.border_color ?? null,
          background_color: productEditAd1?.background_color ?? null,
          show_image: productEditAd1?.show_image ?? true,
          sort_order: selectedAds1.length,
          section_id: productSelectedAds1SectionId,
          is_fixed: ads1FixedModeEnabled,
        });
      }

      setProductEditAd1(null);
      await loadProductSectionContent(subcategoryId);
      toast.success('Ad saved.');
    } catch (error) {
      console.error('Error saving ad 1:', error);
      toast.error('Failed to save ad.');
    }
  };

  const productSaveAd2 = async (subcategoryId: string) => {
    if (!productSelectedAds2SectionId) {
      toast.error('Please select an Ad 2 section.');
      return;
    }

    const selectedAds2 = productAds2.filter((ad) => ad.section_id === productSelectedAds2SectionId).sort((a, b) => a.sort_order - b.sort_order);
    const ads2FixedModeEnabled = selectedAds2.some((ad) => ad.is_fixed);

    try {
      if (productEditAd2?.id) {
        await db
          .from(PRODUCT_ADS_2_TABLE)
          .update({
            image_url: productEditAd2.image_url || null,
            link: productEditAd2.link || null,
            show_border: productEditAd2.show_border ?? false,
            border_color: productEditAd2.border_color ?? null,
            background_color: productEditAd2.background_color ?? null,
            show_image: productEditAd2.show_image ?? true,
            is_fixed: ads2FixedModeEnabled,
          })
          .eq('id', productEditAd2.id);
      } else {
        await db.from(PRODUCT_ADS_2_TABLE).insert({
          image_url: productEditAd2?.image_url || null,
          link: productEditAd2?.link || null,
          show_border: productEditAd2?.show_border ?? false,
          border_color: productEditAd2?.border_color ?? null,
          background_color: productEditAd2?.background_color ?? null,
          show_image: productEditAd2?.show_image ?? true,
          sort_order: selectedAds2.length,
          section_id: productSelectedAds2SectionId,
          is_fixed: ads2FixedModeEnabled,
        });
      }

      setProductEditAd2(null);
      await loadProductSectionContent(subcategoryId);
      toast.success('Ad saved.');
    } catch (error) {
      console.error('Error saving ad 2:', error);
      toast.error('Failed to save ad.');
    }
  };

  const productSaveAd3 = async (subcategoryId: string) => {
    if (!productSelectedAds3SectionId) {
      toast.error('Please select an Ad 3 section.');
      return;
    }

    const selectedAds3 = productAds3.filter((ad) => ad.section_id === productSelectedAds3SectionId).sort((a, b) => a.sort_order - b.sort_order);
    const ads3FixedModeEnabled = selectedAds3.some((ad) => ad.is_fixed);

    try {
      if (productEditAd3?.id) {
        await db
          .from(PRODUCT_ADS_3_TABLE)
          .update({
            image_url: productEditAd3.image_url || null,
            heading: productEditAd3.heading || null,
            description: productEditAd3.description || null,
            link: productEditAd3.link || null,
            show_border: productEditAd3.show_border ?? false,
            border_color: productEditAd3.border_color ?? null,
            background_color: productEditAd3.background_color ?? null,
            show_image: productEditAd3.show_image ?? true,
            is_fixed: ads3FixedModeEnabled,
          })
          .eq('id', productEditAd3.id);
      } else {
        await db.from(PRODUCT_ADS_3_TABLE).insert({
          image_url: productEditAd3?.image_url || null,
          heading: productEditAd3?.heading || null,
          description: productEditAd3?.description || null,
          link: productEditAd3?.link || null,
          show_border: productEditAd3?.show_border ?? false,
          border_color: productEditAd3?.border_color ?? null,
          background_color: productEditAd3?.background_color ?? null,
          show_image: productEditAd3?.show_image ?? true,
          sort_order: selectedAds3.length,
          section_id: productSelectedAds3SectionId,
          is_fixed: ads3FixedModeEnabled,
        });
      }

      setProductEditAd3(null);
      await loadProductSectionContent(subcategoryId);
      toast.success('Ad saved.');
    } catch (error) {
      console.error('Error saving ad 3:', error);
      toast.error('Failed to save ad.');
    }
  };

  const productToggleOfferShowImage = async (itemId: string, showImage: boolean, subcategoryId: string) => {
    try {
      await db.from(PRODUCT_OFFERS_TABLE).update({ show_image: showImage }).eq('id', itemId);
      await loadProductSectionContent(subcategoryId);
    } catch (error) {
      console.error('Error toggling product offer image visibility:', error);
    }
  };

  const productToggleAd1ShowImage = async (itemId: string, showImage: boolean, subcategoryId: string) => {
    try {
      await db.from(PRODUCT_ADS_2_TABLE).update({ show_image: showImage }).eq('id', itemId);
      await loadProductSectionContent(subcategoryId);
    } catch (error) {
      console.error('Error toggling product ad1 image visibility:', error);
    }
  };

  const productToggleAd2ShowImage = async (itemId: string, showImage: boolean, subcategoryId: string) => {
    try {
      await db.from(PRODUCT_ADS_2_TABLE).update({ show_image: showImage }).eq('id', itemId);
      await loadProductSectionContent(subcategoryId);
    } catch (error) {
      console.error('Error toggling product ad2 image visibility:', error);
    }
  };

  const productToggleAd3ShowImage = async (itemId: string, showImage: boolean, subcategoryId: string) => {
    try {
      await db.from(PRODUCT_ADS_3_TABLE).update({ show_image: showImage }).eq('id', itemId);
      await loadProductSectionContent(subcategoryId);
    } catch (error) {
      console.error('Error toggling product ad3 image visibility:', error);
    }
  };

  const productDeleteItem = async (tableName: string, itemId: string, subcategoryId: string) => {
    try {
      await db.from(tableName).delete().eq('id', itemId);
      await loadProductSectionContent(subcategoryId);
      toast.success('Deleted.');
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Failed to delete item.');
    }
  };

  useEffect(() => {
    if (!editingSubcategoryId) return;
    loadProductSectionContent(editingSubcategoryId);
  }, [editingSubcategoryId, productSections, loadProductSectionContent]);

  useEffect(() => {
    const firstByType = (type: string) => productSections.find((s) => s.section_type === type)?.id || '';
    setProductSelectedCardsSectionId((current) => current && productSections.some((s) => s.id === current) ? current : firstByType('cards'));
    setProductSelectedOffersSectionId((current) => current && productSections.some((s) => s.id === current) ? current : firstByType('offers'));
    setProductSelectedAds1SectionId((current) => current && productSections.some((s) => s.id === current) ? current : firstByType('ads_1col'));
    setProductSelectedAds2SectionId((current) => current && productSections.some((s) => s.id === current) ? current : firstByType('ads_2col'));
    setProductSelectedAds3SectionId((current) => current && productSections.some((s) => s.id === current) ? current : firstByType('ads_3col'));
  }, [productSections]);

  async function updateAds3SortOrder(adId: string, newOrder: number) {
    try {
      const { error } = await supabase.from('ads_3col').update({ sort_order: newOrder }).eq('id', adId);
      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Error updating ad order:', err instanceof Error ? err.message : JSON.stringify(err));
      toast.error('Failed to save ad order.');
      return false;
    }
  }

  async function toggleOffersFixedMode(sectionId: string, enabled: boolean) {
    try {
      const { error } = await supabase.from('offers').update({ is_fixed: enabled }).eq('section_id', sectionId);
      if (error) throw error;
      setOffers((prev) => prev.map((offer) => offer.section_id === sectionId ? { ...offer, is_fixed: enabled } : offer));
      toast.success(`Fixed Mode ${enabled ? 'enabled' : 'disabled'}!`);
      return true;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error('Error toggling fixed mode:', err);
      toast.error(`Failed to update Fixed Mode: ${errorMessage}`);
      return false;
    }
  }

  async function toggleCardsFixedMode(sectionId: string, enabled: boolean) {
    try {
      const { error } = await supabase.from('featured_cards').update({ is_fixed: enabled } as any).eq('section_id', sectionId);
      if (error) throw error;
      setCards((prev) => prev.map((card) => card.section_id === sectionId ? { ...card, is_fixed: enabled } : card));
      toast.success(`Fixed Mode ${enabled ? 'enabled' : 'disabled'}!`);
      return true;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error('Error toggling fixed mode:', err);
      toast.error(`Failed to update Fixed Mode: ${errorMessage}`);
      return false;
    }
  }

  async function toggleAds2FixedMode(sectionId: string, enabled: boolean) {
    try {
      const { error } = await supabase.from('ads_2col').update({ is_fixed: enabled } as any).eq('section_id', sectionId);
      if (error) throw error;
      setAds2((prev) => prev.map((ad) => ad.section_id === sectionId ? { ...ad, is_fixed: enabled } : ad));
      toast.success(`Fixed Mode ${enabled ? 'enabled' : 'disabled'}!`);
      return true;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error('Error toggling fixed mode:', err);
      toast.error(`Failed to update Fixed Mode: ${errorMessage}`);
      return false;
    }
  }

  async function toggleAds3FixedMode(sectionId: string, enabled: boolean) {
    try {
      const { error } = await supabase.from('ads_3col').update({ is_fixed: enabled } as any).eq('section_id', sectionId);
      if (error) throw error;
      setAds3((prev) => prev.map((ad) => ad.section_id === sectionId ? { ...ad, is_fixed: enabled } : ad));
      toast.success(`Fixed Mode ${enabled ? 'enabled' : 'disabled'}!`);
      return true;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error('Error toggling fixed mode:', err);
      toast.error(`Failed to update Fixed Mode: ${errorMessage}`);
      return false;
    }
  }

  async function deleteCategory(id: string) {
    try {
      const { error } = await supabase.from('categories' as any).delete().eq('id', id);
      if (error) throw error;
      loadAll();
      toast.success('Deleted!');
    } catch (error) {
      console.error('Error deleting category:', error instanceof Error ? error.message : JSON.stringify(error));
      toast.error('Failed to delete category.');
    }
  }

  async function toggleCategoryVisibility(id: string, isVisible: boolean) {
    try {
      const { error } = await supabase
        .from('categories' as any)
        .update({ is_visible: isVisible })
        .eq('id', id);
      if (error) throw error;
      loadAll();
      toast.success(isVisible ? 'Category is now visible.' : 'Category is now hidden.');
    } catch (error) {
      console.error('Error toggling category visibility:', error instanceof Error ? error.message : JSON.stringify(error));
      toast.error('Failed to update category visibility.');
    }
  }

  async function toggleFeaturedCardVisibility(id: string, isVisible: boolean) {
    try {
      const { error } = await supabase
        .from('featured_cards' as any)
        .update({ is_visible: isVisible })
        .eq('id', id);
      if (error) throw error;
      loadAll();
      toast.success(isVisible ? 'Featured card is now visible.' : 'Featured card is now hidden.');
    } catch (error) {
      console.error('Error toggling featured card visibility:', error instanceof Error ? error.message : JSON.stringify(error));
      toast.error('Failed to update featured card visibility.');
    }
  }

  async function toggleOfferVisibility(id: string, isVisible: boolean) {
    try {
      const { error } = await supabase
        .from('offers' as any)
        .update({ is_visible: isVisible })
        .eq('id', id);
      if (error) throw error;
      loadAll();
      toast.success(isVisible ? 'Offer is now visible.' : 'Offer is now hidden.');
    } catch (error) {
      console.error('Error toggling offer visibility:', error instanceof Error ? error.message : JSON.stringify(error));
      toast.error('Failed to update offer visibility.');
    }
  }

  async function toggleAd2Visibility(id: string, isVisible: boolean) {
    try {
      const { error } = await supabase
        .from('ads_2col' as any)
        .update({ is_visible: isVisible })
        .eq('id', id);
      if (error) throw error;
      loadAll();
      toast.success(isVisible ? 'Ad is now visible.' : 'Ad is now hidden.');
    } catch (error) {
      console.error('Error toggling ad visibility:', error instanceof Error ? error.message : JSON.stringify(error));
      toast.error('Failed to update ad visibility.');
    }
  }

  async function toggleAd3Visibility(id: string, isVisible: boolean) {
    try {
      const { error } = await supabase
        .from('ads_3col' as any)
        .update({ is_visible: isVisible })
        .eq('id', id);
      if (error) throw error;
      loadAll();
      toast.success(isVisible ? 'Ad is now visible.' : 'Ad is now hidden.');
    } catch (error) {
      console.error('Error toggling ad visibility:', error instanceof Error ? error.message : JSON.stringify(error));
      toast.error('Failed to update ad visibility.');
    }
  }

  async function updateCategorySortOrder(categoryId: string, newOrder: number) {
    try {
      const { error } = await supabase.from('categories' as any).update({ sort_order: newOrder }).eq('id', categoryId);
      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Error updating category order:', err instanceof Error ? err.message : JSON.stringify(err));
      toast.error('Failed to save category order.');
      return false;
    }
  }

  async function saveCategory() {
    if (!editCategory) return;
    if (!editCategory.name?.trim()) {
      toast.error('Category name is required.');
      return;
    }
    if (!selectedCategoriesSectionId) {
      toast.error('Please select a section first.');
      return;
    }

    setIsSavingCategory(true);
    try {
      const activeSubId = editingSubcategoryId || '';
      const effectiveButtonsState = activeSubId
        ? { ...editButtonsState, [activeSubId]: editButtons }
        : editButtonsState;
      const effectiveSubBrandsState = activeSubId
        ? { ...editSubBrandsState, [activeSubId]: editSubBrands }
        : editSubBrandsState;
      const effectiveSubOverviewPointsState = activeSubId
        ? { ...editSubOverviewPointsState, [activeSubId]: editSubOverviewPoints }
        : editSubOverviewPointsState;

      let categoryId = editCategory.id;

      // Save category
      if (categoryId) {
        // Update existing category
        const { error: catError } = await supabase
          .from('categories' as any)
          .update({
            name: editCategory.name,
            icon_url: editCategory.icon_url,
            bg_color: editCategory.bg_color,
            show_brands_tab: editCategory.show_brands_tab ?? true,
            is_visible: editCategory.is_visible ?? true,
            section_id: selectedCategoriesSectionId
          })
          .eq('id', categoryId);
        if (catError) throw catError;
      } else {
        // Create new category
        const { data: newCat, error: catError } = await supabase
          .from('categories' as any)
          .insert({
            name: editCategory.name,
            icon_url: editCategory.icon_url,
            bg_color: editCategory.bg_color,
            show_brands_tab: editCategory.show_brands_tab ?? true,
            is_visible: editCategory.is_visible ?? true,
            section_id: selectedCategoriesSectionId,
            sort_order: selectedCategories.length
          })
          .select()
          .single();
        if (catError) throw catError;
        categoryId = (newCat as any).id;
      }

      // Save subcategories
      if (categoryId) {
        const subIds = editSubs.map((s) => s.id).filter(Boolean);
        const activeSub = activeSubId ? editSubs.find((sub) => sub.id === activeSubId) : undefined;
        const subsToUpsert = activeSubId
          ? activeSub ? [activeSub] : []
          : editSubs;

        const subcategoryRows = subsToUpsert.map((sub, index) => ({
          id: sub.id,
          category_id: categoryId,
          name: sub.name,
          link: sub.link || null,
          custom_link: sub.custom_link || null,
          custom_link_type: sub.custom_link_type || 'link',
          video_url: sub.video_url,
          video_url_2: (sub.video_url_2 || []).filter(url => url?.trim()).map(url => url.trim()) || null,
          schedule_link: sub.schedule_link,
          show_schedule_in_separate_tab: sub.show_schedule_in_separate_tab ?? false,
          schedule_link_2: sub.schedule_link_2,
          show_schedule_2_in_separate_tab: sub.show_schedule_2_in_separate_tab ?? false,
          about_heading: sub.about_heading || 'About',
          about_subheading: sub.about_subheading || null,
          about_content: sub.about_content || null,
          overview_points_heading: editKeyFeaturesTabLabelState[sub.id] || sub.overview_points_heading || 'Header',
          detail_description: sub.detail_description || null,
          hero_background_color: sub.hero_background_color || null,
          is_visible: (sub as any).is_visible ?? true,
          show_brands: editShowBrandsState[sub.id] ?? true,
          show_about_section: editShowAboutSectionState[sub.id] ?? true,
          show_header_points_section: editShowHeaderPointsSectionState[sub.id] ?? true,
          brands_tab_label: editBrandsTabLabelState[sub.id] ?? 'Brands',
          key_features_tab_label: editKeyFeaturesTabLabelState[sub.id] || 'Key Features',
          form_link: sub.form_link || null,
          show_form_in_separate_tab: sub.show_form_in_separate_tab ?? false,
          tab_order: editTabOrderState[sub.id] || ['overview', 'key_features', 'brands', 'form'],
          about_bg_color: sub.about_bg_color || null,
          about_heading_color: sub.about_heading_color || null,
          about_subheading_color: sub.about_subheading_color || null,
          about_description_color: sub.about_description_color || null,
          about_button_bg_color: sub.about_button_bg_color || null,
          about_button_text_color: sub.about_button_text_color || null,
          button_1_text: sub.button_1_text || null,
          button_1_link: sub.button_1_link || null,
          button_1_visible: sub.button_1_visible ?? false,
          button_2_text: sub.button_2_text || null,
          button_2_link: sub.button_2_link || null,
          button_2_visible: sub.button_2_visible ?? false,
          button_3_text: sub.button_3_text || null,
          button_3_link: sub.button_3_link || null,
          button_3_visible: sub.button_3_visible ?? false,
          sort_order: resolveSubcategorySortOrder(sub, index),
        }));

        const deleteSubcategories = activeSubId
          ? Promise.resolve()
          : (subIds.length > 0
            ? subIds.reduce(
              (query, id) => query.neq('id', id),
              supabase.from('subcategories').delete().eq('category_id', categoryId),
            )
            : supabase.from('subcategories').delete().eq('category_id', categoryId));

        const deleteButtons = activeSubId
          ? supabase.from('category_buttons').delete().eq('subcategory_id', activeSubId)
          : (subIds.length > 0
            ? supabase.from('category_buttons').delete().in('subcategory_id', subIds)
            : Promise.resolve());

        const deleteSubBrands = activeSubId
          ? supabase.from('subcategory_brands' as any).delete().eq('subcategory_id', activeSubId)
          : (subIds.length > 0
            ? supabase.from('subcategory_brands' as any).delete().in('subcategory_id', subIds)
            : Promise.resolve());

        const buttonsToInsert: any[] = [];
        if (activeSubId) {
          const subButtons = effectiveButtonsState[activeSubId] || [];
          subButtons.forEach((button, index) => {
            if (button.label?.trim() || button.link?.trim()) {
              buttonsToInsert.push({
                id: button.id || crypto.randomUUID(),
                subcategory_id: activeSubId,
                label: button.label?.trim() || 'Button',
                link: button.link?.trim() || null,
                is_visible: button.is_visible,
                sort_order: index,
              });
            }
          });
        } else {
          for (const sub of editSubs) {
            const subButtons = effectiveButtonsState[sub.id] || [];
            subButtons.forEach((button, index) => {
              if (button.label?.trim() || button.link?.trim()) {
                buttonsToInsert.push({
                  id: button.id || crypto.randomUUID(),
                  subcategory_id: sub.id,
                  label: button.label?.trim() || 'Button',
                  link: button.link?.trim() || null,
                  is_visible: button.is_visible,
                  sort_order: index,
                });
              }
            });
          }
        }

        const subBrandsToInsert: any[] = [];
        if (activeSubId) {
          const subBrands = effectiveSubBrandsState[activeSubId] || [];
          subBrands.forEach((brand, index) => {
            if (brand.name) {
              subBrandsToInsert.push({
                id: brand.id || crypto.randomUUID(),
                subcategory_id: activeSubId,
                name: brand.name,
                logo_url: brand.logo_url,
                link: brand.link,
                description: brand.description,
                buttons: brand.buttons || [],
                is_visible: brand.is_visible ?? true,
                sort_order: index,
                action_links: buildBrandActionLinkPayload(brand.action_links),
                action_link_1_text: brand.action_links?.[0]?.text ?? brand.action_link_1_text,
                action_link_1_url: brand.action_links?.[0]?.url ?? brand.action_link_1_url,
                action_link_1_new_tab: brand.action_links?.[0]?.new_tab ?? brand.action_link_1_new_tab,
                action_link_1_enabled: brand.action_links?.[0]?.enabled ?? brand.action_link_1_enabled,
                action_link_2_text: brand.action_links?.[1]?.text ?? brand.action_link_2_text,
                action_link_2_url: brand.action_links?.[1]?.url ?? brand.action_link_2_url,
                action_link_2_new_tab: brand.action_links?.[1]?.new_tab ?? brand.action_link_2_new_tab,
                action_link_2_enabled: brand.action_links?.[1]?.enabled ?? brand.action_link_2_enabled,
                action_link_3_text: brand.action_links?.[2]?.text ?? brand.action_link_3_text,
                action_link_3_url: brand.action_links?.[2]?.url ?? brand.action_link_3_url,
                action_link_3_new_tab: brand.action_links?.[2]?.new_tab ?? brand.action_link_3_new_tab,
                action_link_3_enabled: brand.action_links?.[2]?.enabled ?? brand.action_link_3_enabled,
                primary_cta_label: brand.primary_cta_label,
                primary_cta_link: brand.primary_cta_link,
                primary_cta_visible: brand.primary_cta_visible,
                more_actions_label: brand.more_actions_label,
                more_actions_visible: brand.more_actions_visible,
                join_network_label: brand.join_network_label,
                join_network_link: brand.join_network_link,
                join_network_visible: brand.join_network_visible,
              });
            }
          });
        } else {
          for (const subId of subIds) {
            const subBrands = effectiveSubBrandsState[subId] || [];
            subBrands.forEach((brand, index) => {
              if (brand.name) {
                subBrandsToInsert.push({
                  id: brand.id || crypto.randomUUID(),
                  subcategory_id: subId,
                  name: brand.name,
                  logo_url: brand.logo_url,
                  link: brand.link,
                  description: brand.description,
                  buttons: brand.buttons || [],
                  is_visible: brand.is_visible ?? true,
                  sort_order: index,
                  action_links: buildBrandActionLinkPayload(brand.action_links),
                  action_link_1_text: brand.action_links?.[0]?.text ?? brand.action_link_1_text,
                  action_link_1_url: brand.action_links?.[0]?.url ?? brand.action_link_1_url,
                  action_link_1_new_tab: brand.action_links?.[0]?.new_tab ?? brand.action_link_1_new_tab,
                  action_link_1_enabled: brand.action_links?.[0]?.enabled ?? brand.action_link_1_enabled,
                  action_link_2_text: brand.action_links?.[1]?.text ?? brand.action_link_2_text,
                  action_link_2_url: brand.action_links?.[1]?.url ?? brand.action_link_2_url,
                  action_link_2_new_tab: brand.action_links?.[1]?.new_tab ?? brand.action_link_2_new_tab,
                  action_link_2_enabled: brand.action_links?.[1]?.enabled ?? brand.action_link_2_enabled,
                  action_link_3_text: brand.action_links?.[2]?.text ?? brand.action_link_3_text,
                  action_link_3_url: brand.action_links?.[2]?.url ?? brand.action_link_3_url,
                  action_link_3_new_tab: brand.action_links?.[2]?.new_tab ?? brand.action_link_3_new_tab,
                  action_link_3_enabled: brand.action_links?.[2]?.enabled ?? brand.action_link_3_enabled,
                  primary_cta_label: brand.primary_cta_label,
                  primary_cta_link: brand.primary_cta_link,
                  primary_cta_visible: brand.primary_cta_visible,
                  more_actions_label: brand.more_actions_label,
                  more_actions_visible: brand.more_actions_visible,
                  join_network_label: brand.join_network_label,
                  join_network_link: brand.join_network_link,
                  join_network_visible: brand.join_network_visible,
                });
              }
            });
          }
        }

        const subsUpsertPromise = subcategoryRows.length > 0
          ? upsertWithMissingColumnFallback('subcategories', subcategoryRows as any)
          : Promise.resolve();

        const deletePromises = [deleteSubcategories, deleteButtons, deleteSubBrands];
        await Promise.all(deletePromises);

        const insertPromises = [
          buttonsToInsert.length > 0 ? insertWithMissingColumnFallback('category_buttons', buttonsToInsert) : Promise.resolve(),
          subBrandsToInsert.length > 0 ? insertWithMissingColumnFallback('subcategory_brands', subBrandsToInsert) : Promise.resolve(),
        ];

        const sectionSubIds = activeSubId ? [activeSubId] : subIds;
        const aboutPromises = sectionSubIds.map(subId => saveAboutSections(subId));
        const keyFeaturePromises = sectionSubIds.map(subId => saveKeyFeaturesSections(subId, effectiveSubOverviewPointsState[subId] || []));

        await Promise.all([
          subsUpsertPromise,
          ...insertPromises,
          ...aboutPromises,
          ...keyFeaturePromises,
        ]);
      }

      toast.success('Category saved successfully!');
      setEditCategory(null);
      setEditSubs([]);
      refreshCategoryListData().catch((reloadError) => {
        console.error('Failed to reload category list data after save:', reloadError);
      });
    } catch (error) {
      console.error('Error saving category:', error instanceof Error ? error.message : JSON.stringify(error));
      toast.error('Failed to save category.');
    } finally {
      setIsSavingCategory(false);
    }
  }

  async function saveContactSettings() {
    setIsSavingContact(true);
    try {
      console.log('Starting saveContactSettings...');

      // Step 1: Fetch ALL contact settings records (in case there are duplicates)
      const { data: allRecords, error: fetchAllError } = await supabase
        .from('contact_settings')
        .select('*');

      if (fetchAllError) {
        console.error('❌ Error fetching all contact settings records:', fetchAllError);
        throw fetchAllError;
      }

      console.log('📋 Fetched contact settings records:', allRecords);

      // Prepare data to save (keep all current state values)
      const dataToSave = {
        heading: contactSettings.heading,
        email_label: contactSettings.email_label,
        email: contactSettings.email,
        description_1: contactSettings.description_1,
        description_2: contactSettings.description_2,
        image_url: contactSettings.image_url,
        phone: contactSettings.phone,
        whatsapp: contactSettings.whatsapp,
        address: contactSettings.address,
        form_embed: contactSettings.form_embed,
        contact_emails: contactSettings.contact_emails as any,
        nodal_officer_title: contactSettings.nodal_officer_title,
        nodal_officer_name: contactSettings.nodal_officer_name,
        nodal_officer_phone: contactSettings.nodal_officer_phone,
        nodal_officer_email: contactSettings.nodal_officer_email,
        nodal_officer_visible: contactSettings.nodal_officer_visible ?? true,
        appellate_authority_title: contactSettings.appellate_authority_title,
        appellate_authority_name: contactSettings.appellate_authority_name,
        appellate_authority_phone: contactSettings.appellate_authority_phone,
        appellate_authority_email: contactSettings.appellate_authority_email,
        appellate_authority_visible: contactSettings.appellate_authority_visible ?? true,
        is_visible: contactSettings.is_visible ?? true,
      };

      let result;
      if (allRecords && allRecords.length > 0) {
        // If records exist: UPDATE the first one, DELETE others
        const firstRecordId = allRecords[0].id;

        // Update the first record
        console.log('🔄 Updating existing record with ID:', firstRecordId);
        result = await supabase
          .from('contact_settings')
          .update(dataToSave as any)
          .eq('id', firstRecordId);

        if (result.error) {
          console.error('❌ Error updating contact settings:', result.error);
          throw result.error;
        }

        // Delete any extra records if there are duplicates
        if (allRecords.length > 1) {
          console.log('🗑️ Deleting', allRecords.length - 1, 'duplicate record(s)');
          const extraRecordIds = allRecords.slice(1).map(r => r.id);
          await supabase
            .from('contact_settings')
            .delete()
            .in('id', extraRecordIds);
        }
      } else {
        // If no records exist: INSERT a new one
        console.log('➕ No existing records, inserting new one');
        result = await supabase
          .from('contact_settings')
          .insert([dataToSave as any])
          .select('*');

        if (result.error) {
          console.error('❌ Error inserting contact settings:', result.error);
          throw result.error;
        }
      }

      console.log('✅ Contact settings saved successfully!');
      toast.success('Contact page settings saved successfully');
      loadAll();
    } catch (error: any) {
      console.error('💥 Error in saveContactSettings:', error);
      toast.error(`Failed to save contact settings: ${error.message || 'Unknown error'}`);
    } finally {
      setIsSavingContact(false);
    }
  }

  async function saveLegalPage(slug: string, content: string, title: string, isVisible: boolean) {
    setIsSavingLegal(true);
    try {
      // Find existing page to get ID if available
      const existingPage = legalPages.find(p => p.slug === slug);

      // Build data object without is_visible first, add it only if we're sure it's safe
      const dataToUpsert: any = {
        id: existingPage?.id,
        slug,
        content,
        title,
        updated_at: new Date().toISOString(),
      };

      // Try to add is_visible, but if it fails, save without it
      try {
        dataToUpsert.is_visible = isVisible;
        const { error } = await supabase
          .from('legal_pages')
          .upsert(dataToUpsert, {
            onConflict: 'slug'
          });
        if (error) {
          // If is_visible caused an error, try saving without it
          delete dataToUpsert.is_visible;
          const { error: retryError } = await supabase
            .from('legal_pages')
            .upsert(dataToUpsert, {
              onConflict: 'slug'
            });
          if (retryError) throw retryError;
          toast.warning(`Page saved, but 'is_visible' column not found in your database. Please add it in Supabase!`);
        } else {
          toast.success(`${title} saved successfully`);
        }
      } catch (e) {
        throw e;
      }

      loadAll();
    } catch (error: any) {
      console.error('Error saving legal page:', error);
      toast.error(`Failed to save legal page: ${error.message || 'Unknown error'}`);
    } finally {
      setIsSavingLegal(false);
    }
  }

  async function handleSaveHeader() {
    setIsSavingHeader(true);
    try {
      const dataToSave = {
        leave_review_text: headerSettings.leave_review_text,
        leave_review_link: headerSettings.leave_review_link,
        leave_review_visible: headerSettings.leave_review_visible,
        for_providers_text: headerSettings.for_providers_text,
        for_providers_link: headerSettings.for_providers_link,
        for_providers_visible: headerSettings.for_providers_visible,
        sign_in_text: headerSettings.sign_in_text,
        sign_in_link: headerSettings.sign_in_link,
        sign_in_visible: headerSettings.sign_in_visible,
        join_text: headerSettings.join_text,
        join_link: headerSettings.join_link,
        join_visible: headerSettings.join_visible,
        submit_button_text: headerSettings.submit_button_text,
        submit_button_link: headerSettings.submit_button_link,
        submit_button_visible: headerSettings.submit_button_visible,
        updated_at: new Date().toISOString(),
      };

      let result;
      if (headerSettings.id) {
        result = await supabase
          .from('header_settings')
          .update(dataToSave)
          .eq('id', headerSettings.id);
      } else {
        const { data: existingData } = await supabase
          .from('header_settings')
          .select('id')
          .limit(1);

        if (existingData && existingData.length > 0) {
          result = await supabase
            .from('header_settings')
            .update(dataToSave)
            .eq('id', existingData[0].id);
        } else {
          result = await supabase
            .from('header_settings')
            .insert([dataToSave]);
        }
      }

      const { error } = result;
      if (error) throw error;

      toast.success('Header settings saved successfully');
      loadAll();
    } catch (error: any) {
      console.error('Error saving header settings:', error);
      toast.error(`Failed to save header settings: ${error.message || 'Unknown error'}`);
    } finally {
      setIsSavingHeader(false);
    }
  }

  async function handleSaveFooter() {
    setIsSavingFooter(true);
    try {
      // Prepare data with only existing database columns
      const dataToSave: any = {
        description: footerSettings.description,
        description_visible: footerSettings.description_visible ?? true,
        twitter_label: footerSettings.twitter_label,
        twitter_link: footerSettings.twitter_link,
        twitter_visible: footerSettings.twitter_visible ?? true,
        linkedin_label: footerSettings.linkedin_label,
        linkedin_link: footerSettings.linkedin_link,
        linkedin_visible: footerSettings.linkedin_visible ?? true,
        facebook_label: footerSettings.facebook_label,
        facebook_link: footerSettings.facebook_link,
        facebook_visible: footerSettings.facebook_visible ?? true,
        instagram_label: footerSettings.instagram_label,
        instagram_link: footerSettings.instagram_link,
        instagram_visible: footerSettings.instagram_visible ?? false,
        youtube_label: footerSettings.youtube_label,
        youtube_link: footerSettings.youtube_link,
        youtube_visible: footerSettings.youtube_visible ?? false,
        social_whatsapp_visible: footerSettings.social_whatsapp_visible ?? false,
        social_media_visible: footerSettings.social_media_visible ?? true,
        about_us_visible: footerSettings.about_us_visible ?? true,
        contact_visible: footerSettings.contact_visible ?? true,
        privacy_policy_visible: footerSettings.privacy_policy_visible ?? true,
        terms_of_service_visible: footerSettings.terms_of_service_visible ?? true,
        refund_policy_visible: footerSettings.refund_policy_visible ?? true,
        refund_policy_1_visible: footerSettings.refund_policy_1_visible ?? true,
        refund_policy_2_visible: footerSettings.refund_policy_2_visible ?? true,
        refund_policy_3_visible: footerSettings.refund_policy_3_visible ?? true,
        refund_policy_4_visible: footerSettings.refund_policy_4_visible ?? true,
        faq_visible: footerSettings.faq_visible ?? true,
        faq_heading: footerSettings.faq_heading ?? 'Frequently Asked Questions',
        whatsapp_number: footerSettings.whatsapp_number ?? '',
        whatsapp_visible: footerSettings.whatsapp_visible ?? false,
        phone: footerSettings.phone ?? '',
        phone_visible: footerSettings.phone_visible ?? false,
        email: footerSettings.email ?? '',
        email_visible: footerSettings.email_visible ?? false,
        bottom_footer_email: footerSettings.bottom_footer_email ?? '',
        bottom_footer_email_visible: footerSettings.bottom_footer_email_visible ?? false,
        bottom_branding_visible: footerSettings.bottom_branding_visible ?? true,
        bottom_branding_text: footerSettings.bottom_branding_text ?? '',
        submit_rft_label: footerSettings.submit_rft_label ?? 'Submit RFT',
        submit_rft_url: footerSettings.submit_rft_url ?? '',
        submit_rft_enabled: footerSettings.submit_rft_enabled ?? false,
        get_recommendations_label: footerSettings.get_recommendations_label ?? 'Get Recommendations',
        get_recommendations_url: footerSettings.get_recommendations_url ?? '',
        get_recommendations_enabled: footerSettings.get_recommendations_enabled ?? false,
        get_listed_visible: footerSettings.get_listed_visible ?? true,
        advertise_visible: footerSettings.advertise_visible ?? true,
        write_for_us_visible: footerSettings.write_for_us_visible ?? true,
        vendor_guidelines_visible: footerSettings.vendor_guidelines_visible ?? true,
        view_all_categories_visible: footerSettings.view_all_categories_visible ?? true,
        vendors_visible: footerSettings.vendors_visible ?? true,
        buyers_visible: footerSettings.buyers_visible ?? true,
        updated_at: new Date().toISOString(),
      };

      let result;
      if (footerSettings.id) {
        // Update existing record
        result = await supabase
          .from('footer_settings')
          .update(dataToSave)
          .eq('id', footerSettings.id);
      } else {
        // Get first footer settings record ID or create new one
        const { data: existingData } = await supabase
          .from('footer_settings')
          .select('id')
          .limit(1);

        if (existingData && existingData.length > 0) {
          result = await supabase
            .from('footer_settings')
            .update(dataToSave)
            .eq('id', existingData[0].id);
        } else {
          result = await supabase
            .from('footer_settings')
            .insert([dataToSave]);
        }
      }

      const { error } = result;
      if (error) throw error;

      toast.success('Footer settings saved successfully');
      loadAll(); // Reload data to confirm save
    } catch (error: any) {
      console.error('Error saving footer settings:', error);
      toast.error(`Failed to save footer settings: ${error.message || 'Unknown error'}`);
    } finally {
      setIsSavingFooter(false);
    }
  }

  async function saveOffer() {
    if (!editOffer) return;
    const hasOfferContent =
      Boolean(editOffer.image_url) ||
      Boolean(editOffer.heading?.trim()) ||
      Boolean(editOffer.description?.trim());

    if (!hasOfferContent) {
      toast.error('Add an image, heading, or description.');
      return;
    }
    try {
      const selectedOffersCount = selectedOffers.length;

      if (editOffer.id) {
        const updateData: any = { heading: editOffer.heading?.trim() || '', description: editOffer.description, image_url: editOffer.image_url, link: editOffer.link, show_border: editOffer.show_border ?? false, border_color: editOffer.border_color ?? null, background_color: editOffer.background_color ?? null, show_image: editOffer.show_image ?? true, open_in_new_tab: editOffer.open_in_new_tab ?? false };
        if (offersFixedModeEnabled !== undefined) {
          updateData.is_fixed = offersFixedModeEnabled;
        }
        const { error } = await supabase.from('offers').update(updateData).eq('id', editOffer.id);
        if (error) throw error;
      } else {
        const insertData: any = {
          heading: editOffer.heading?.trim() || '',
          description: editOffer.description,
          image_url: editOffer.image_url,
          link: editOffer.link,
          show_border: editOffer.show_border ?? false,
          border_color: editOffer.border_color ?? null,
          background_color: editOffer.background_color ?? null,
          show_image: editOffer.show_image ?? true,
          open_in_new_tab: editOffer.open_in_new_tab ?? false,
          sort_order: selectedOffersCount,
          section_id: selectedOffersSectionId,
        };
        if (offersFixedModeEnabled !== undefined) {
          insertData.is_fixed = offersFixedModeEnabled;
        }
        const { error } = await supabase.from('offers').insert(insertData);
        if (error) throw error;
      }
      setEditOffer(null); loadAll(); toast.success('Offer saved!');
    } catch (error) {
      console.error('Error saving offer:', error instanceof Error ? error.message : JSON.stringify(error));
      toast.error('Failed to save offer.');
    }
  }

  async function deleteOffer(id: string) {
    try {
      const { error } = await supabase.from('offers').delete().eq('id', id);
      if (error) throw error;
      loadAll();
      toast.success('Deleted!');
    } catch (error) {
      console.error('Error deleting offer:', error instanceof Error ? error.message : JSON.stringify(error));
      toast.error('Failed to delete offer.');
    }
  }

  async function saveAd2() {
    if (!editAd2) return;
    try {
      if (editAd2.id) {
        const updateData: any = { image_url: editAd2.image_url, link: editAd2.link, show_border: editAd2.show_border ?? false, border_color: editAd2.border_color ?? null, background_color: editAd2.background_color ?? null, show_image: editAd2.show_image ?? true };
        if (ads2FixedModeEnabled !== undefined) {
          updateData.is_fixed = ads2FixedModeEnabled;
        }
        const { error } = await supabase.from('ads_2col').update(updateData).eq('id', editAd2.id);
        if (error) throw error;
      } else {
        const insertData: any = { image_url: editAd2.image_url, link: editAd2.link, show_border: editAd2.show_border ?? false, border_color: editAd2.border_color ?? null, background_color: editAd2.background_color ?? null, show_image: editAd2.show_image ?? true, sort_order: ads2.length, section_id: selectedAds2SectionId };
        if (ads2FixedModeEnabled !== undefined) {
          insertData.is_fixed = ads2FixedModeEnabled;
        }
        const { error } = await supabase.from('ads_2col').insert(insertData);
        if (error) throw error;
      }
      setEditAd2(null); loadAll(); toast.success('Ad saved!');
    } catch (error) {
      console.error('Error saving ad:', error instanceof Error ? error.message : JSON.stringify(error));
      toast.error('Failed to save ad.');
    }
  }

  async function saveAd1() {
    if (!editAd1) return;
    try {
      if (editAd1.id) {
        const updateData: any = { image_url: editAd1.image_url, link: editAd1.link, show_border: editAd1.show_border ?? false, border_color: editAd1.border_color ?? null, background_color: editAd1.background_color ?? null, show_image: editAd1.show_image ?? true };
        if (ads1FixedModeEnabled !== undefined) {
          updateData.is_fixed = ads1FixedModeEnabled;
        }
        const { error } = await supabase.from('ads_2col').update(updateData).eq('id', editAd1.id);
        if (error) throw error;
      } else {
        const insertData: any = { image_url: editAd1.image_url, link: editAd1.link, show_border: editAd1.show_border ?? false, border_color: editAd1.border_color ?? null, background_color: editAd1.background_color ?? null, show_image: editAd1.show_image ?? true, sort_order: selectedAds1.length, section_id: selectedAds1SectionId };
        if (ads1FixedModeEnabled !== undefined) {
          insertData.is_fixed = ads1FixedModeEnabled;
        }
        const { error } = await supabase.from('ads_2col').insert(insertData);
        if (error) throw error;
      }
      setEditAd1(null); loadAll(); toast.success('Ad saved!');
    } catch (error) {
      console.error('Error saving ad:', error instanceof Error ? error.message : JSON.stringify(error));
      toast.error('Failed to save ad.');
    }
  }

  async function deleteAd2(id: string) {
    try {
      const { error } = await supabase.from('ads_2col').delete().eq('id', id);
      if (error) throw error;
      loadAll();
      toast.success('Deleted!');
    } catch (error) {
      console.error('Error deleting ad:', error instanceof Error ? error.message : JSON.stringify(error));
      toast.error('Failed to delete ad.');
    }
  }

  async function saveAd3() {
    if (!editAd3) return;
    try {
      if (editAd3.id) {
        const updateData: any = {
          image_url: editAd3.image_url,
          heading: editAd3.heading || null,
          description: editAd3.description || null,
          link: editAd3.link,
          show_border: editAd3.show_border ?? false,
          border_color: editAd3.border_color ?? null,
          background_color: editAd3.background_color ?? null,
          show_image: editAd3.show_image ?? true,
          open_in_new_tab: editAd3.open_in_new_tab ?? false,
        };
        if (ads3FixedModeEnabled !== undefined) {
          updateData.is_fixed = ads3FixedModeEnabled;
        }
        const { error } = await supabase.from('ads_3col').update(updateData).eq('id', editAd3.id);
        if (error) throw error;
      } else {
        const insertData: any = {
          image_url: editAd3.image_url,
          heading: editAd3.heading || null,
          description: editAd3.description || null,
          link: editAd3.link,
          show_border: editAd3.show_border ?? false,
          border_color: editAd3.border_color ?? null,
          background_color: editAd3.background_color ?? null,
          show_image: editAd3.show_image ?? true,
          open_in_new_tab: editAd3.open_in_new_tab ?? false,
          sort_order: ads3.length,
          section_id: selectedAds3SectionId,
        };
        if (ads3FixedModeEnabled !== undefined) {
          insertData.is_fixed = ads3FixedModeEnabled;
        }
        const { error } = await supabase.from('ads_3col').insert(insertData);
        if (error) throw error;
      }
      setEditAd3(null); loadAll(); toast.success('Ad saved!');
    } catch (error) {
      console.error('Error saving ad:', error instanceof Error ? error.message : JSON.stringify(error));
      toast.error('Failed to save ad.');
    }
  }

  async function toggleOfferShowImage(id: string, showImage: boolean) {
    try {
      const { error } = await supabase.from('offers').update({ show_image: showImage }).eq('id', id);
      if (error) throw error;
      loadAll();
    } catch (error) {
      console.error('Error toggling offer image visibility:', error);
    }
  }

  async function toggleAd1ShowImage(id: string, showImage: boolean) {
    try {
      const { error } = await supabase.from('ads_2col').update({ show_image: showImage }).eq('id', id);
      if (error) throw error;
      loadAll();
    } catch (error) {
      console.error('Error toggling ad 1 image visibility:', error);
    }
  }

  async function toggleAd2ShowImage(id: string, showImage: boolean) {
    try {
      const { error } = await supabase.from('ads_2col').update({ show_image: showImage }).eq('id', id);
      if (error) throw error;
      loadAll();
    } catch (error) {
      console.error('Error toggling ad 2 image visibility:', error);
    }
  }

  async function toggleAd3ShowImage(id: string, showImage: boolean) {
    try {
      const { error } = await supabase.from('ads_3col').update({ show_image: showImage }).eq('id', id);
      if (error) throw error;
      loadAll();
    } catch (error) {
      console.error('Error toggling ad 3 image visibility:', error);
    }
  }

  async function deleteAd3(id: string) {
    try {
      const { error } = await supabase.from('ads_3col').delete().eq('id', id);
      if (error) throw error;
      loadAll();
      toast.success('Deleted!');
    } catch (error) {
      console.error('Error deleting ad:', error instanceof Error ? error.message : JSON.stringify(error));
      toast.error('Failed to delete ad.');
    }
  }

  async function handleLogout() { await supabase.auth.signOut(); navigate('/admin/login'); }

  // Handle adding a new section
  async function handleAddSection() {
    if (!addSectionType.trim()) {
      toast.error('Please select a section type');
      return;
    }
    if (!addSectionName.trim()) {
      toast.error('Please enter a section name');
      return;
    }
    setAddingSectionLoading(true);
    try {
      const result = await addSection(addSectionType, addSectionName);
      if (result) {
        toast.success('Section added successfully!');
        setShowAddSectionModal(false);
        setAddSectionType('');
        setAddSectionName('');
      } else {
        toast.error('Failed to add section');
      }
    } catch (error) {
      console.error('Error adding section:', JSON.stringify(error));
      toast.error('Error adding section');
    } finally {
      setAddingSectionLoading(false);
    }
  }

  // Handle deleting a section
  async function handleDeleteSection(sectionId: string) {
    if (!window.confirm('Are you sure you want to delete this section?')) return;
    const success = await deleteSection(sectionId);
    if (success) {
      toast.success('Section deleted!');
    } else {
      toast.error('Failed to delete section');
    }
  }

  // Handle opening heading edit modal
  function openHeadingEdit(sectionId: string) {
    const section = sections.find(s => s.id === sectionId);
    if (section) {
      setEditingHeadingSectionId(sectionId);
      setEditingHeadingText(section.heading || '');
      setEditingHeadingVisible(section.show_heading !== false);
      setEditingHeadingBackgroundColor(section.background_color || '');
    }
  }

  // Handle saving heading
  async function handleSaveHeading() {
    if (!editingHeadingSectionId) return;

    try {
      const success1 = await updateHeading(editingHeadingSectionId, editingHeadingText, editingHeadingBackgroundColor);
      const success2 = await toggleShowHeading(editingHeadingSectionId, editingHeadingVisible);

      // Also sync the section name (tab label) with the heading text
      const success3 = await updateSectionName(editingHeadingSectionId, editingHeadingText || 'Featured Cards');

      if (success1 && success2 && success3) {
        toast.success('Heading and tab label updated!');
        setEditingHeadingSectionId(null);
        // Refetch sections
        const { data: updatedSections } = await supabase
          .from('page_sections')
          .select('*')
          .order('sort_order', { ascending: true });
        if (updatedSections) setSections(updatedSections);
      }
    } catch (error) {
      console.error('Error saving heading:', JSON.stringify(error));
      toast.error('Failed to save heading');
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  const sectionLabels: Record<string, string> = {
    hero: '🏠 Hero Section', cards: '🃏 Featured Cards', categories: '📂 Categories',
    offers: '🎁 Offers & Discounts', ads_1col: '📰 1-Column Ad', ads_2col: '📰 2-Column Ads', ads_3col: '📰 3-Column Ads',
  };

  return (
    <div className="min-h-screen flex bg-muted">
      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-0 md:w-64 overflow-hidden md:overflow-visible'} transition-all duration-300 bg-sidebar text-sidebar-foreground flex flex-col fixed md:relative inset-y-0 left-0 z-40 md:z-auto`}>
        <div className="p-3 md:p-5 border-b border-sidebar-border">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="w-8 h-8 md:w-9 md:h-9 rounded-lg bg-sidebar-primary flex items-center justify-center flex-shrink-0">
              <span className="text-sidebar-primary-foreground font-bold text-xs md:text-sm">SM</span>
            </div>
            <div className="min-w-0">
              <h1 className="font-bold text-xs md:text-sm">Admin Panel</h1>
              <p className="text-xs opacity-60">SoftMarket</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-2 md:p-3 space-y-0.5 md:space-y-1 overflow-y-auto">
          {SIDEBAR_ITEMS.map((item) => (
            <div key={item.key}>
              <button
                onClick={() => {
                  if (item.children) {
                    setExpandedSidebarItem(expandedSidebarItem === item.key ? null : item.key);
                  } else {
                    setTab(item.key);
                    setSidebarOpen(false);
                    setExpandedSidebarItem(null); // Close sub-menus when clicking a main item
                  }
                }}
                className={`w-full flex items-center justify-between px-2 md:px-3 py-2 md:py-2.5 rounded-lg text-xs md:text-sm font-medium transition-colors ${tab === item.key || (item.children && item.children.some(child => child.key === tab))
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                  }`}
              >
                <div className="flex items-center gap-2 md:gap-3 min-w-0">
                  <span className="w-5 h-5 flex-shrink-0">{item.icon}</span>
                  <span className="truncate">{item.label}</span>
                </div>
                {item.children && (
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${expandedSidebarItem === item.key ? 'rotate-180' : ''}`} />
                )}
              </button>

              {item.children && expandedSidebarItem === item.key && (
                <div className="mt-1 ml-4 space-y-0.5 md:space-y-1 border-l border-sidebar-border/50 pl-2">
                  {item.children.map((child) => (
                    <button
                      key={child.key}
                      onClick={() => {
                        setTab(child.key);
                        setSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-2 md:gap-3 px-2 md:px-3 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-colors ${tab === child.key
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                        : 'text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
                        }`}
                    >
                      <span className="truncate">{child.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
        <div className="p-2 md:p-3 border-t border-sidebar-border space-y-0.5 md:space-y-1">
          <Link to="/" className="flex items-center gap-2 md:gap-3 px-2 md:px-3 py-2 md:py-2.5 rounded-lg text-xs md:text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent">
            <Home className="w-5 h-5 flex-shrink-0" /> <span className="truncate">View Site</span>
          </Link>
          <button onClick={handleLogout} className="w-full flex items-center gap-2 md:gap-3 px-2 md:px-3 py-2 md:py-2.5 rounded-lg text-xs md:text-sm text-red-400 hover:bg-red-500/10">
            <LogOut className="w-5 h-5 flex-shrink-0" /> <span className="truncate">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className={`flex-1 transition-all duration-300 w-full ${sidebarOpen ? 'md:ml-64' : 'md:ml-0'}`}>
        <header className="bg-card border-b border-border sticky top-0 z-30 px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-lg hover:bg-secondary md:hidden">
            <Layers className="w-5 h-5" />
          </button>
          <span className="text-xs md:text-sm text-muted-foreground truncate">{user?.email}</span>
        </header>

        <div className="p-4 md:p-6">
          {/* DASHBOARD */}
          {tab === 'dashboard' && (
            <div>
              <h2 className="text-xl md:text-2xl font-bold mb-1">Welcome to Admin Panel</h2>
              <p className="text-sm md:text-base text-muted-foreground mb-6 md:mb-8">Manage all website content from here.</p>
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4 mb-6 md:mb-8">
                {[
                  { label: 'Feature Cards', count: cards.length, icon: <CreditCard className="w-5 h-5 md:w-6 md:h-6 text-primary" /> },
                  { label: 'Categories', count: categories.length, icon: <Tag className="w-5 h-5 md:w-6 md:h-6 text-primary" /> },
                  { label: 'Offers', count: offers.length, icon: <Star className="w-5 h-5 md:w-6 md:h-6 text-primary" /> },
                  { label: 'Advertisements', count: ads2.length + ads3.length, icon: <Image className="w-5 h-5 md:w-6 md:h-6 text-primary" /> },
                ].map((stat) => (
                  <div key={stat.label} className="bg-card rounded-lg md:rounded-xl border border-border p-3 md:p-5">
                    <div className="flex items-center justify-between mb-2 md:mb-3">
                      <span className="text-xs md:text-sm text-muted-foreground">{stat.label}</span>
                      {stat.icon}
                    </div>
                    <p className="text-2xl md:text-3xl font-bold">{stat.count}</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                {[
                  { title: 'Edit Hero Section', desc: 'Update heading and animated words', action: () => setTab('hero'), icon: <Type className="w-6 h-6 md:w-8 md:h-8 text-primary" /> },
                  { title: 'Page Layout', desc: 'Drag & drop sections order', action: () => setTab('sections'), icon: <Layers className="w-6 h-6 md:w-8 md:h-8 text-primary" /> },
                  { title: 'Categories', desc: 'Manage category groups', action: () => setTab('categories'), icon: <Tag className="w-6 h-6 md:w-8 md:h-8 text-primary" /> },
                  { title: 'Offers', desc: 'Manage offers & discounts', action: () => setTab('offers'), icon: <Star className="w-6 h-6 md:w-8 md:h-8 text-primary" /> },
                ].map((item) => (
                  <button key={item.title} onClick={item.action} className="bg-card rounded-lg md:rounded-xl border border-border p-3 md:p-5 text-left hover:shadow-md transition-shadow">
                    <div className="mb-2 md:mb-3">{item.icon}</div>
                    <h3 className="font-semibold text-sm md:text-base mb-1">{item.title}</h3>
                    <p className="text-xs md:text-sm text-muted-foreground">{item.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* HERO */}
          {tab === 'hero' && (
            <div className="max-w-lg space-y-4">
              <div className="flex items-center justify-between gap-3 mb-4">
                <h2 className="text-xl font-bold">Edit Hero Section</h2>
                <label className="flex items-center gap-2 text-xs md:text-sm cursor-pointer">
                  <Switch checked={heroVisible} onCheckedChange={(checked) => setHeroVisible(Boolean(checked))} />
                  <span className="text-xs whitespace-nowrap">{heroVisible ? 'ON' : 'OFF'}</span>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium">Search Bar</label>
                <label className="flex items-center gap-2 text-xs md:text-sm cursor-pointer">
                  <Switch checked={heroSearchVisible} onCheckedChange={(checked) => setHeroSearchVisible(Boolean(checked))} />
                  <span className="text-xs whitespace-nowrap">{heroSearchVisible ? 'ON' : 'OFF'}</span>
                </label>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium">Text Part 1</label>
                  <label className="flex items-center gap-2 text-xs md:text-sm cursor-pointer">
                    <Switch checked={heroTextPart1Visible} onCheckedChange={(checked) => setHeroTextPart1Visible(Boolean(checked))} />
                    <span className="text-xs whitespace-nowrap">{heroTextPart1Visible ? 'ON' : 'OFF'}</span>
                  </label>
                </div>
                <input
                  value={heroTextPart1}
                  onChange={(e) => setHeroTextPart1(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-input bg-background"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium">Text Part 2</label>
                  <label className="flex items-center gap-2 text-xs md:text-sm cursor-pointer">
                    <Switch checked={heroTextPart2Visible} onCheckedChange={(checked) => setHeroTextPart2Visible(Boolean(checked))} />
                    <span className="text-xs whitespace-nowrap">{heroTextPart2Visible ? 'ON' : 'OFF'}</span>
                  </label>
                </div>
                <input
                  value={heroTextPart2}
                  onChange={(e) => setHeroTextPart2(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-input bg-background"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setHeroWords((prev) => [...prev, '']);
                      setHeroAnimatedWordVisibility((prev) => [...prev, true]);
                    }}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold"
                  >
                    <Plus className="w-4 h-4" /> Add Word
                  </button>
                  <label className="flex items-center gap-2 text-xs md:text-sm cursor-pointer">
                    <Switch checked={heroAnimatedWordsVisible} onCheckedChange={(checked) => setHeroAnimatedWordsVisible(Boolean(checked))} />
                    <span className="text-xs whitespace-nowrap">{heroAnimatedWordsVisible ? 'ON' : 'OFF'}</span>
                  </label>
                </div>

                <div className="space-y-2">
                  {heroWords.map((word, index) => (
                    <div key={`hero-word-${index}`} className="flex items-center gap-2 w-full p-3 bg-card rounded-lg border border-border">
                      <input
                        value={word}
                        onChange={(e) => {
                          const newWords = [...heroWords];
                          newWords[index] = e.target.value;
                          setHeroWords(newWords);
                        }}
                        className="flex-1 px-3 py-2 rounded-lg border border-input bg-background"
                        placeholder="Enter animated word"
                      />
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={heroAnimatedWordVisibility[index] ?? true}
                          onCheckedChange={(checked) =>
                            setHeroAnimatedWordVisibility((prev) =>
                              prev.map((value, i) => (i === index ? Boolean(checked) : value))
                            )
                          }
                        />
                        <span className="text-xs whitespace-nowrap">{(heroAnimatedWordVisibility[index] ?? true) ? 'ON' : 'OFF'}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setHeroWords((prev) => prev.filter((_, i) => i !== index));
                          setHeroAnimatedWordVisibility((prev) => prev.filter((_, i) => i !== index));
                        }}
                        className="p-2 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <button onClick={saveHero} className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold flex items-center gap-2">
                <Save className="w-4 h-4" /> Save Hero
              </button>
            </div>
          )}

          {/* HEADER OPTIONS */}
          {tab === 'header' && (
            <div className="max-w-2xl space-y-8">
              <div>
                <h2 className="text-xl font-bold mb-1">Header Options</h2>
                <p className="text-sm text-muted-foreground mb-6">Manage the top header bar items.</p>
              </div>

              <div className="grid gap-6">
                {/* Leave a Review */}
                <div className="bg-card rounded-xl border border-border p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold">Leave a Review</h3>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={headerSettings.leave_review_visible}
                        onCheckedChange={(checked) => setHeaderSettings({ ...headerSettings, leave_review_visible: checked })}
                      />
                      <span className="text-sm font-medium">{headerSettings.leave_review_visible ? 'Visible' : 'Hidden'}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Text</label>
                      <input
                        value={headerSettings.leave_review_text}
                        onChange={(e) => setHeaderSettings({ ...headerSettings, leave_review_text: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-lg border border-input bg-background"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Link</label>
                      <input
                        value={headerSettings.leave_review_link}
                        onChange={(e) => setHeaderSettings({ ...headerSettings, leave_review_link: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-lg border border-input bg-background"
                      />
                    </div>
                  </div>
                </div>

                {/* For Providers */}
                <div className="bg-card rounded-xl border border-border p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold">For Providers</h3>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={headerSettings.for_providers_visible}
                        onCheckedChange={(checked) => setHeaderSettings({ ...headerSettings, for_providers_visible: checked })}
                      />
                      <span className="text-sm font-medium">{headerSettings.for_providers_visible ? 'Visible' : 'Hidden'}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Text</label>
                      <input
                        value={headerSettings.for_providers_text}
                        onChange={(e) => setHeaderSettings({ ...headerSettings, for_providers_text: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-lg border border-input bg-background"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Link</label>
                      <input
                        value={headerSettings.for_providers_link}
                        onChange={(e) => setHeaderSettings({ ...headerSettings, for_providers_link: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-lg border border-input bg-background"
                      />
                    </div>
                  </div>
                </div>



                {/* Join */}
                <div className="bg-card rounded-xl border border-border p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold">Join</h3>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={headerSettings.join_visible}
                        onCheckedChange={(checked) => setHeaderSettings({ ...headerSettings, join_visible: checked })}
                      />
                      <span className="text-sm font-medium">{headerSettings.join_visible ? 'Visible' : 'Hidden'}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Text</label>
                      <input
                        value={headerSettings.join_text}
                        onChange={(e) => setHeaderSettings({ ...headerSettings, join_text: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-lg border border-input bg-background"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Link (WhatsApp or any URL)</label>
                      <input
                        value={headerSettings.join_link}
                        onChange={(e) => setHeaderSettings({ ...headerSettings, join_link: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-lg border border-input bg-background"
                      />
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="bg-card rounded-xl border border-border p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold">Submit Button (Main Header)</h3>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={headerSettings.submit_button_visible}
                        onCheckedChange={(checked) => setHeaderSettings({ ...headerSettings, submit_button_visible: checked })}
                      />
                      <span className="text-sm font-medium">{headerSettings.submit_button_visible ? 'Visible' : 'Hidden'}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Button Text</label>
                      <input
                        value={headerSettings.submit_button_text}
                        onChange={(e) => setHeaderSettings({ ...headerSettings, submit_button_text: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-lg border border-input bg-background"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Button Link</label>
                      <input
                        value={headerSettings.submit_button_link}
                        onChange={(e) => setHeaderSettings({ ...headerSettings, submit_button_link: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-lg border border-input bg-background"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={handleSaveHeader}
                disabled={isSavingHeader}
                className="w-full md:w-auto px-8 py-3 rounded-lg bg-primary text-primary-foreground font-bold flex items-center justify-center gap-2 shadow-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isSavingHeader ? 'Saving...' : <><Save className="w-5 h-5" /> Save Header Options</>}
              </button>
            </div>
          )}

          {/* SECTIONS */}
          {tab === 'sections' && (
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-bold mb-2">Page Layout - Manage Sections</h2>
                <p className="text-sm text-muted-foreground">Drag to reorder sections. Manage visibility and edit individual sections from their tabs.</p>
              </div>

              {sections.length > 0 ? (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleSectionDragEnd}>
                  <SortableContext
                    items={sections.map(s => s.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-3 md:space-y-4">
                      {sections.map((s) => {
                        // Count items in this section
                        let itemCount = 0;
                        if (s.section_type === 'cards') itemCount = cards.filter(c => c.section_id === s.id).length;
                        else if (s.section_type === 'categories') itemCount = categories.filter(c => c.section_id === s.id).length;
                        else if (s.section_type === 'offers') itemCount = offers.filter(o => o.section_id === s.id).length;
                        else if (s.section_type === 'ads_1col') itemCount = ads2.filter(a => a.section_id === s.id).length;
                        else if (s.section_type === 'ads_2col') itemCount = ads2.filter(a => a.section_id === s.id).length;
                        else if (s.section_type === 'ads_3col') itemCount = ads3.filter(a => a.section_id === s.id).length;

                        return (
                          <SortableItem key={s.id} id={s.id} disabled={s.is_locked}>
                            <div className="bg-card border border-border rounded-lg p-3 md:p-4 hover:border-primary/50 transition-colors group">
                              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:mb-0">
                                <div className="flex items-start md:items-center gap-2 md:gap-3 flex-1 min-w-0">
                                  <GripVertical className="w-6 md:w-8 h-6 md:h-8 text-muted-foreground cursor-grab active:cursor-grabbing opacity-50 group-hover:opacity-100 flex-shrink-0 mt-1 md:mt-0" />
                                  <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-sm md:text-base break-words">{getSectionDisplayName(s)}</h3>
                                    <p className="text-xs md:text-sm text-muted-foreground">{itemCount} items • {s.section_type}</p>
                                  </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-2 md:gap-3 w-full md:w-auto">
                                  <label className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm cursor-pointer">
                                    <Switch
                                      checked={s.is_visible}
                                      onCheckedChange={async (checked) => {
                                        await toggleVisibility(s.id, Boolean(checked));
                                      }}
                                    />
                                    <span className="text-xs whitespace-nowrap">{s.is_visible ? 'ON' : 'OFF'}</span>
                                  </label>

                                  <label className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm cursor-pointer">
                                    <Switch
                                      checked={s.is_locked}
                                      onCheckedChange={async (checked) => {
                                        await toggleLockState(s.id, Boolean(checked));
                                      }}
                                    />
                                    <span className="text-xs whitespace-nowrap">{s.is_locked ? 'Fixed' : 'Moving'}</span>
                                  </label>

                                  <button
                                    onClick={() => handleDeleteSection(s.id)}
                                    className="p-1 md:p-1.5 rounded text-destructive hover:bg-destructive/10 transition-colors opacity-0 md:opacity-100 group-hover:opacity-100"
                                    title="Delete section"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </SortableItem>
                        );
                      })}
                    </div>
                  </SortableContext>
                </DndContext>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">No sections added yet. Create sections from the tabs above.</p>
              )}
            </div>
          )}

          {/* CARDS */}
          {tab === 'cards' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Featured Cards</h2>
                <button
                  onClick={() => {
                    setAddSectionType('cards');
                    setShowAddSectionModal(true);
                  }}
                  className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold flex items-center gap-1.5 hover:bg-green-700"
                >
                  <Plus className="w-4 h-4" /> Add New Section
                </button>
              </div>

              {/* Section instances tabs */}
              {sections.filter(s => s.section_type === 'cards').length > 0 && (
                <div className="mb-6 hidden md:block">
                  <div className="flex gap-2 flex-wrap mb-4 overflow-x-auto pb-2">
                    {sections.filter(s => s.section_type === 'cards').map(section => (
                      <button
                        key={section.id}
                        onClick={() => setSelectedCardsSectionId(section.id)}
                        className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${selectedCardsSectionId === section.id
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-card border border-border text-foreground hover:bg-muted'
                          }`}
                      >
                        {getSectionDisplayName(section)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-4 mb-4">
                <p className="text-xs md:text-sm text-muted-foreground">
                  {selectedCardsSectionId ? `Adding cards to: ${getSectionDisplayName(sections.find(s => s.id === selectedCardsSectionId))}` : 'No section selected'}
                </p>
                {selectedCardsSectionId && (
                  <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
                    <label className="flex items-center gap-2 text-sm self-center md:self-auto">
                      <Switch
                        checked={cardsFixedModeEnabled}
                        onCheckedChange={async (checked) => {
                          await toggleCardsFixedMode(selectedCardsSectionId, Boolean(checked));
                        }}
                      />
                      <span className="text-xs">Fixed Mode</span>
                      <span className="text-xs">{cardsFixedModeEnabled ? 'ON' : 'OFF'}</span>
                    </label>
                    <button
                      onClick={() => openHeadingEdit(selectedCardsSectionId)}
                      className="px-3 py-2 md:px-4 md:py-2 rounded-lg bg-blue-600 text-white text-xs md:text-sm font-semibold flex items-center justify-center gap-1.5 hover:bg-blue-700"
                    >
                      <Pencil className="w-4 h-4" />
                      <span className="hidden md:inline">Edit Heading</span>
                      <span className="md:hidden">Edit</span>
                    </button>
                    <button
                      onClick={() => handleDeleteSection(selectedCardsSectionId)}
                      className="px-3 py-2 md:px-4 md:py-2 rounded-lg bg-destructive text-destructive-foreground text-xs md:text-sm font-semibold flex items-center justify-center gap-1.5"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="hidden md:inline">Delete Section</span>
                      <span className="md:hidden">Delete</span>
                    </button>
                    <button
                      onClick={() => setEditCard({ title: '', description: '', logo_url: null, link: null, show_border: false, border_color: null, background_color: null, open_in_new_tab: false })}
                      className="px-3 py-2 md:px-4 md:py-2 rounded-lg bg-primary text-primary-foreground text-xs md:text-sm font-semibold flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      <span className="hidden md:inline">Add Card</span>
                      <span className="md:hidden">Add</span>
                    </button>
                  </div>
                )}
              </div>

              {cardsFixedModeEnabled ? (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleCardDragEnd}>
                  <SortableContext items={selectedCards.map((card) => card.id)} strategy={verticalListSortingStrategy}>
                    <div className="grid gap-3">
                      {selectedCards.map((card) => (
                        <SortableOfferItem key={card.id} id={card.id} disabled={!cardsFixedModeEnabled}>
                          {card.logo_url && <img src={card.logo_url} alt="" className="w-12 h-12 rounded-lg object-contain bg-muted p-1" />}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm">{card.title}</h3>
                            <div className="text-xs text-muted-foreground line-clamp-2" dangerouslySetInnerHTML={{ __html: card.description || '' }} />
                          </div>
                          <div className="flex items-center gap-1 bg-muted/50 px-2 py-1 rounded-lg border border-border">
                            <Switch
                              checked={card.is_visible ?? true}
                              onCheckedChange={(checked) => toggleFeaturedCardVisibility(card.id, Boolean(checked))}
                            />
                            <span className="text-[10px] font-medium text-muted-foreground uppercase">{(card.is_visible ?? true) ? 'ON' : 'OFF'}</span>
                          </div>
                          <button onClick={() => setEditCard(card)} className="p-2 text-muted-foreground hover:text-foreground"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => deleteCard(card.id)} className="p-2 text-destructive"><Trash2 className="w-4 h-4" /></button>
                        </SortableOfferItem>
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              ) : (
                <div className="grid gap-3">
                  {cards
                    .filter(c => selectedCardsSectionId ? c.section_id === selectedCardsSectionId : true)
                    .map((card) => (
                      <div key={card.id} className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border">
                        {card.logo_url && <img src={card.logo_url} alt="" className="w-12 h-12 rounded-lg object-contain bg-muted p-1" />}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm">{card.title}</h3>
                          <div className="text-xs text-muted-foreground line-clamp-2" dangerouslySetInnerHTML={{ __html: card.description || '' }} />
                        </div>
                        <div className="flex items-center gap-1 bg-muted/50 px-2 py-1 rounded-lg border border-border">
                          <Switch
                            checked={card.is_visible ?? true}
                            onCheckedChange={(checked) => toggleFeaturedCardVisibility(card.id, Boolean(checked))}
                          />
                          <span className="text-[10px] font-medium text-muted-foreground uppercase">{(card.is_visible ?? true) ? 'ON' : 'OFF'}</span>
                        </div>
                        <button onClick={() => setEditCard(card)} className="p-2 text-muted-foreground hover:text-foreground"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => deleteCard(card.id)} className="p-2 text-destructive"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    ))}
                </div>
              )}
              {editCard && (
                <Modal title={editCard.id ? 'Edit Card' : 'Add Card'} onClose={() => setEditCard(null)}>
                  <div className="space-y-4">
                    <ImageUpload label="Logo" value={editCard.logo_url || null} onChange={(url) => setEditCard({ ...editCard, logo_url: url })} folder="cards" />
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Title</label>
                      <input value={editCard.title || ''} onChange={(e) => setEditCard({ ...editCard, title: e.target.value })} className="w-full px-4 py-2.5 rounded-lg border border-input bg-background" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Description</label>
                      <CKEditor value={editCard.description || ''} onChange={(value) => setEditCard({ ...editCard, description: value })} className="min-h-[100px]" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Link (optional)</label>
                      <input value={editCard.link || ''} onChange={(e) => setEditCard({ ...editCard, link: e.target.value || null })} className="w-full px-4 py-2.5 rounded-lg border border-input bg-background" />
                    </div>
                    <label className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Switch checked={editCard.show_border ?? false} onCheckedChange={(checked) => setEditCard({ ...editCard, show_border: Boolean(checked) })} />
                      <span>Enable Border</span>
                    </label>
                    <label className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Switch checked={editCard.open_in_new_tab ?? false} onCheckedChange={(checked) => setEditCard({ ...editCard, open_in_new_tab: Boolean(checked) })} />
                      <span>Open in new tab</span>
                    </label>
                    {editCard.show_border && (
                      <div>
                        <label className="block text-sm font-medium mb-1.5">Border Color</label>
                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            value={editCard.border_color || '#000000'}
                            onChange={(e) => setEditCard({ ...editCard, border_color: e.target.value })}
                            className="h-10 w-20 rounded cursor-pointer border-0"
                          />
                          <input
                            type="text"
                            value={editCard.border_color || ''}
                            onChange={(e) => setEditCard({ ...editCard, border_color: e.target.value || null })}
                            placeholder="#000000"
                            className="flex-1 px-4 py-2.5 rounded-lg border border-input bg-background"
                          />
                        </div>
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Card Background Color</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={editCard.background_color || '#fcf9f5'}
                          onChange={(e) => setEditCard({ ...editCard, background_color: e.target.value })}
                          className="h-10 w-20 rounded cursor-pointer border-0"
                        />
                        <input
                          type="text"
                          value={editCard.background_color || ''}
                          onChange={(e) => setEditCard({ ...editCard, background_color: e.target.value || null })}
                          placeholder="#fcf9f5"
                          className="flex-1 px-4 py-2.5 rounded-lg border border-input bg-background"
                        />
                      </div>
                    </div>
                    <button onClick={saveCard} className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold">Save</button>
                  </div>
                </Modal>
              )}
            </div>
          )}

          {/* CATEGORIES */}
          {tab === 'categories' && (
            <div>
              {!editingSubcategoryId ? (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold">Categories</h2>
                    <button
                      onClick={() => {
                        setAddSectionType('categories');
                        setShowAddSectionModal(true);
                      }}
                      className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold flex items-center gap-1.5 hover:bg-green-700"
                    >
                      <Plus className="w-4 h-4" /> Add New Section
                    </button>
                  </div>

                  {/* Section instances tabs */}
                  {sections.filter(s => s.section_type === 'categories').length > 0 && (
                    <div className="mb-6 hidden md:block">
                      <div className="flex gap-2 flex-wrap mb-4 overflow-x-auto pb-2">
                        {sections.filter(s => s.section_type === 'categories').map(section => (
                          <button
                            key={section.id}
                            onClick={() => setSelectedCategoriesSectionId(section.id)}
                            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${selectedCategoriesSectionId === section.id
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-card border border-border text-foreground hover:bg-muted'
                              }`}
                          >
                            {getSectionDisplayName(section)}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-4 mb-4">
                    <p className="text-xs md:text-sm text-muted-foreground">
                      {selectedCategoriesSectionId ? `Adding categories to: ${getSectionDisplayName(sections.find(s => s.id === selectedCategoriesSectionId))}` : 'No section selected'}
                    </p>
                    {selectedCategoriesSectionId && (
                      <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
                        <button
                          onClick={() => openHeadingEdit(selectedCategoriesSectionId)}
                          className="px-3 py-2 md:px-4 md:py-2 rounded-lg bg-blue-600 text-white text-xs md:text-sm font-semibold flex items-center justify-center gap-1.5 hover:bg-blue-700"
                        >
                          <Pencil className="w-4 h-4" />
                          <span className="hidden md:inline">Edit Heading</span>
                          <span className="md:hidden">Edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteSection(selectedCategoriesSectionId)}
                          className="px-3 py-2 md:px-4 md:py-2 rounded-lg bg-destructive text-destructive-foreground text-xs md:text-sm font-semibold flex items-center justify-center gap-1.5"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="hidden md:inline">Delete Section</span>
                          <span className="md:hidden">Delete</span>
                        </button>
                        <button
                          onClick={() => { setEditCategory({ name: '', bg_color: '#FFF9C4', icon_url: null, show_brands_tab: true }); setEditSubs([]); setEditSubcategory(null); }}
                          className="px-3 py-2 md:px-4 md:py-2 rounded-lg bg-primary text-primary-foreground text-xs md:text-sm font-semibold flex items-center justify-center gap-1.5"
                        >
                          <Plus className="w-4 h-4" />
                          <span className="hidden md:inline">Add Category</span>
                          <span className="md:hidden">Add</span>
                        </button>
                      </div>
                    )}
                  </div>

                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleCategoryDragEnd}>
                    <SortableContext items={selectedCategories.map((cat) => cat.id)} strategy={verticalListSortingStrategy}>
                      <div className="grid gap-3">
                        {selectedCategories.map((cat) => (
                          <div key={cat.id}>
                            <SortableCategoryItem id={cat.id}>
                              <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: cat.bg_color }}>
                                {cat.icon_url && <img src={cat.icon_url} alt="" className="w-6 h-6 object-contain" />}
                              </div>
                              <div className="flex-1">
                                <h3 className="font-semibold text-sm">{cat.name}</h3>
                                <p className="text-xs text-muted-foreground">
                                  {subcategories.filter(s => s.category_id === cat.id).length} subcategories
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1 bg-muted/50 px-2 py-1 rounded-lg border border-border">
                                  <Switch
                                    checked={cat.is_visible ?? true}
                                    onCheckedChange={(checked) => toggleCategoryVisibility(cat.id, Boolean(checked))}
                                  />
                                  <span className="text-[10px] font-medium text-muted-foreground uppercase">{(cat.is_visible ?? true) ? 'ON' : 'OFF'}</span>
                                </div>
                                <button onClick={() => { setEditCategory(cat); setEditSubs(subcategories.filter(s => s.category_id === cat.id)); setEditSubcategory(null); }} className="p-2 text-muted-foreground hover:text-foreground"><Pencil className="w-4 h-4" /></button>
                                <button onClick={() => deleteCategory(cat.id)} className="p-2 text-destructive"><Trash2 className="w-4 h-4" /></button>
                              </div>
                            </SortableCategoryItem>
                            {editCategory?.id === cat.id && (
                              <div className="rounded-2xl border border-border bg-card p-6 space-y-6">
                                <div className="flex items-center justify-between gap-4">
                                  <div>
                                    <h3 className="text-lg font-semibold">{editCategory.id ? 'Edit Category' : 'Add Category'}</h3>
                                    <p className="text-sm text-muted-foreground">Edit category details and subcategories below.</p>
                                  </div>
                                  <div className="flex gap-2">
                                    <button
                                      type="button"
                                      onClick={() => { setEditCategory(null); setEditSubs([]); setEditSubcategory(null); }}
                                      className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
                                    >
                                      Cancel
                                    </button>
                                    <button onClick={async () => {
                                      if (editingSubcategoryId) {
                                        const editingSub = editSubs.find(s => s.id === editingSubcategoryId);
                                        if (editingSub) {
                                          setEditButtonsState(prev => ({ ...prev, [editingSub.id]: editButtons }));
                                          setEditSubOverviewPointsState(prev => ({ ...prev, [editingSub.id]: editSubOverviewPoints }));
                                          setEditSubBrandsState(prev => ({ ...prev, [editingSub.id]: editSubBrands }));
                                        }
                                      }
                                      await saveCategory();
                                    }} disabled={isSavingCategory} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed">
                                      {isSavingCategory ? 'Saving...' : 'Save'}
                                    </button>
                                  </div>
                                </div>

                                <div className="space-y-4">
                                  <ImageUpload label="Icon" value={editCategory.icon_url || null} onChange={(url) => setEditCategory({ ...editCategory, icon_url: url })} folder="categories" />
                                  <div>
                                    <label className="block text-sm font-medium mb-1.5">Name</label>
                                    <input value={editCategory.name || ''} onChange={(e) => setEditCategory({ ...editCategory, name: e.target.value })} className="w-full px-4 py-2.5 rounded-lg border border-input bg-background" />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium mb-1.5">Background Color</label>
                                    <div className="flex items-center gap-3">
                                      <input type="color" value={editCategory.bg_color || '#FFF9C4'} onChange={(e) => setEditCategory({ ...editCategory, bg_color: e.target.value })} className="w-12 h-10 rounded border border-input cursor-pointer" />
                                      <input value={editCategory.bg_color || ''} onChange={(e) => setEditCategory({ ...editCategory, bg_color: e.target.value })} className="flex-1 px-4 py-2.5 rounded-lg border border-input bg-background" />
                                    </div>
                                  </div>

                                  <div>
                                    <div className="flex items-center justify-between mb-2">
                                      <label className="text-sm font-medium">Subcategories</label>
                                      <button
                                        type="button"
                                        onClick={() => setEditSubcategory({ id: crypto.randomUUID(), category_id: editCategory.id || '', name: '', link: null, video_url: null, image_url: null, sort_order: editSubs.length })}
                                        className="text-sm text-primary font-semibold"
                                      >
                                        + Add
                                      </button>
                                    </div>
                                    {editSubs.length === 0 ? (
                                      <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                                        No subcategories added yet.
                                      </div>
                                    ) : (
                                      <DndContext
                                        sensors={sensors}
                                        collisionDetection={closestCenter}
                                        onDragEnd={handleSubcategoryDragEnd}
                                      >
                                        <SortableContext
                                          items={editSubs.map(s => s.id)}
                                          strategy={verticalListSortingStrategy}
                                        >
                                          <div className="space-y-3">
                                            {editSubs.map((sub) => (
                                              <SortableAdminItem key={sub.id} id={sub.id}>
                                                <div className="flex flex-1 flex-col items-start gap-3 md:flex-row md:items-center md:justify-between">
                                                  <div className="min-w-0">
                                                    <p className="truncate font-semibold text-sm">{sub.name || 'Untitled subcategory'}</p>
                                                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                                                    </div>
                                                  </div>
                                                  <div className="flex items-center gap-2">
                                                    <label className="flex items-center gap-1 rounded-lg border border-border bg-background px-2 py-1.5 text-xs font-medium text-muted-foreground">
                                                      <Switch
                                                        checked={(sub as any).is_visible ?? true}
                                                        onCheckedChange={(checked) => {
                                                          setEditSubs((prev) => prev.map((item) => item.id === sub.id ? { ...item, is_visible: Boolean(checked) } : item));
                                                        }}
                                                      />
                                                      <span>{(sub as any).is_visible ?? true ? 'Visible' : 'Hidden'}</span>
                                                    </label>
                                                    <button
                                                      type="button"
                                                      onClick={() => {
                                                        setEditingSubcategoryId(sub.id);
                                                        setEditButtons(editButtonsState[sub.id] || []);
                                                        setEditSubBrands(editSubBrandsState[sub.id] || []);
                                                        setEditShowBrandsState((prev) => ({ ...prev, [sub.id]: sub.show_brands ?? true }));
                                                        setEditShowAboutSectionState((prev) => ({ ...prev, [sub.id]: (sub as any).show_about_section ?? true }));
                                                        setEditShowHeaderPointsSectionState((prev) => ({ ...prev, [sub.id]: (sub as any).show_header_points_section ?? true }));
                                                        setEditBrandsTabLabelState((prev) => ({ ...prev, [sub.id]: (sub as any).brands_tab_label || 'Brands' }));
                                                        setEditKeyFeaturesTabLabelState((prev) => ({ ...prev, [sub.id]: (sub as any).key_features_tab_label || 'Key Features' }));
                                                        setEditTabOrderState((prev) => ({ ...prev, [sub.id]: sub.tab_order || ['overview', 'key_features', 'brands', 'form'] }));
                                                        setEditSubOverviewPoints(editSubOverviewPointsState[sub.id] || []);
                                                        setEditKeyFeaturesSections(prev => ({
                                                          ...prev,
                                                          [sub.id]: editKeyFeaturesSections[sub.id] || keyFeaturesSections.filter(s => s.subcategory_id === sub.id)
                                                        }));
                                                        setEditAboutSections(prev => ({
                                                          ...prev,
                                                          [sub.id]: editAboutSections[sub.id] || aboutSections.filter(s => s.subcategory_id === sub.id)
                                                        }));
                                                      }}
                                                      className="rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
                                                    >
                                                      Edit
                                                    </button>
                                                    <button
                                                      type="button"
                                                      onClick={() => setEditSubs(editSubs.filter((item) => item.id !== sub.id))}
                                                      className="rounded-lg p-2 text-destructive hover:bg-destructive/10"
                                                    >
                                                      <X className="w-4 h-4" />
                                                    </button>
                                                  </div>
                                                </div>
                                              </SortableAdminItem>
                                            ))}
                                          </div>
                                        </SortableContext>
                                      </DndContext>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                  {editCategory && !editCategory.id && (
                    <div className="rounded-2xl border border-border bg-card p-6 space-y-6">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <h3 className="text-lg font-semibold">Add Category</h3>
                          <p className="text-sm text-muted-foreground">Create a new category below.</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => { setEditCategory(null); setEditSubs([]); setEditSubcategory(null); }}
                            className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
                          >
                            Cancel
                          </button>
                          <button onClick={async () => {
                            if (editingSubcategoryId) {
                              const editingSub = editSubs.find(s => s.id === editingSubcategoryId);
                              if (editingSub) {
                                setEditButtonsState(prev => ({ ...prev, [editingSub.id]: editButtons }));
                                setEditSubOverviewPointsState(prev => ({ ...prev, [editingSub.id]: editSubOverviewPoints }));
                                setEditSubBrandsState(prev => ({ ...prev, [editingSub.id]: editSubBrands }));
                              }
                            }
                            await saveCategory();
                          }} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
                            Save
                          </button>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <ImageUpload label="Icon" value={editCategory.icon_url || null} onChange={(url) => setEditCategory({ ...editCategory, icon_url: url })} folder="categories" />
                        <div>
                          <label className="block text-sm font-medium mb-1.5">Name</label>
                          <input value={editCategory.name || ''} onChange={(e) => setEditCategory({ ...editCategory, name: e.target.value })} className="w-full px-4 py-2.5 rounded-lg border border-input bg-background" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1.5">Background Color</label>
                          <div className="flex items-center gap-3">
                            <input type="color" value={editCategory.bg_color || '#FFF9C4'} onChange={(e) => setEditCategory({ ...editCategory, bg_color: e.target.value })} className="w-12 h-10 rounded border border-input cursor-pointer" />
                            <input value={editCategory.bg_color || ''} onChange={(e) => setEditCategory({ ...editCategory, bg_color: e.target.value })} className="flex-1 px-4 py-2.5 rounded-lg border border-input bg-background" />
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium">Subcategories</label>
                            <button
                              type="button"
                              onClick={() => setEditSubcategory({ id: crypto.randomUUID(), category_id: editCategory.id || '', name: '', link: null, video_url: null, image_url: null, sort_order: editSubs.length })}
                              className="text-sm text-primary font-semibold"
                            >
                              + Add
                            </button>
                          </div>
                          {editSubs.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                              No subcategories added yet.
                            </div>
                          ) : (
                            <DndContext
                              sensors={sensors}
                              collisionDetection={closestCenter}
                              onDragEnd={handleSubcategoryDragEnd}
                            >
                              <SortableContext
                                items={editSubs.map(s => s.id)}
                                strategy={verticalListSortingStrategy}
                              >
                                <div className="space-y-3">
                                  {editSubs.map((sub) => (
                                    <SortableAdminItem key={sub.id} id={sub.id}>
                                      <div className="flex flex-1 flex-col items-start gap-3 md:flex-row md:items-center md:justify-between">
                                        <div className="min-w-0">
                                          <p className="truncate font-semibold text-sm">{sub.name || 'Untitled subcategory'}</p>
                                          <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setEditingSubcategoryId(sub.id);
                                              setEditButtons(editButtonsState[sub.id] || []);
                                              setEditSubBrands(editSubBrandsState[sub.id] || []);
                                              setEditShowBrandsState((prev) => ({ ...prev, [sub.id]: sub.show_brands ?? true }));
                                              setEditShowAboutSectionState((prev) => ({ ...prev, [sub.id]: (sub as any).show_about_section ?? true }));
                                              setEditShowHeaderPointsSectionState((prev) => ({ ...prev, [sub.id]: (sub as any).show_header_points_section ?? true }));
                                              setEditBrandsTabLabelState((prev) => ({ ...prev, [sub.id]: (sub as any).brands_tab_label || 'Brands' }));
                                              setEditTabOrderState((prev) => ({ ...prev, [sub.id]: sub.tab_order || ['overview', 'key_features', 'brands', 'form'] }));
                                              setEditSubOverviewPoints(editSubOverviewPointsState[sub.id] || []);
                                              setEditKeyFeaturesSections(prev => ({
                                                ...prev,
                                                [sub.id]: editKeyFeaturesSections[sub.id] || keyFeaturesSections.filter(s => s.subcategory_id === sub.id)
                                              }));
                                              setEditAboutSections(prev => ({
                                                ...prev,
                                                [sub.id]: editAboutSections[sub.id] || aboutSections.filter(s => s.subcategory_id === sub.id)
                                              }));
                                            }}
                                            className="rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
                                          >
                                            Edit
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => setEditSubs(editSubs.filter((item) => item.id !== sub.id))}
                                            className="rounded-lg p-2 text-destructive hover:bg-destructive/10"
                                          >
                                            <X className="w-4 h-4" />
                                          </button>
                                        </div>
                                      </div>
                                    </SortableAdminItem>
                                  ))}
                                </div>
                              </SortableContext>
                            </DndContext>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  {editSubcategory && !editSubs.some((sub) => sub.id === editSubcategory.id) && (
                    <Modal
                      title="Add Subcategory"
                      onClose={() => setEditSubcategory(null)}
                    >
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-1.5">Name</label>
                          <input
                            value={editSubcategory.name || ''}
                            onChange={(e) => setEditSubcategory({ ...editSubcategory, name: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-lg border border-input bg-background"
                          />
                        </div>
                        <div className="flex justify-end gap-3">
                          <button
                            type="button"
                            onClick={() => setEditSubcategory(null)}
                            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (!editSubcategory.name?.trim()) return;
                              const nextSub: Subcategory = {
                                id: editSubcategory.id || crypto.randomUUID(),
                                category_id: editSubcategory.category_id || editCategory?.id || '',
                                name: editSubcategory.name.trim(),
                                link: editSubcategory.link?.trim() || null,
                                video_url: editSubcategory.video_url?.trim() || null,
                                image_url: editSubcategory.image_url?.trim() || null,
                                video_url_2: (editSubcategory.video_url_2 || []).filter(url => url?.trim()).map(url => url.trim()) || null,
                                detail_description: editSubcategory.detail_description?.trim() || null,
                                is_visible: (editSubcategory as any).is_visible ?? true,
                                show_brands: editShowBrandsState[editSubcategory.id || 'new'] ?? true,
                                show_about_section: editShowAboutSectionState[editSubcategory.id || 'new'] ?? true,
                                show_header_points_section: editShowHeaderPointsSectionState[editSubcategory.id || 'new'] ?? true,
                                sort_order: editSubs.length,
                              };
                              setEditSubs((current) => {
                                const existingIndex = current.findIndex((sub) => sub.id === nextSub.id);
                                if (existingIndex >= 0) {
                                  const next = [...current];
                                  next[existingIndex] = { ...next[existingIndex], ...nextSub };
                                  return next;
                                }
                                return [...current, nextSub];
                              });
                              const subcategoryId = nextSub.id;
                              setEditShowBrandsState((prev) => ({ ...prev, [subcategoryId]: editShowBrandsState[editSubcategory.id || 'new'] ?? true }));
                              setEditShowAboutSectionState((prev) => ({ ...prev, [subcategoryId]: editShowAboutSectionState[editSubcategory.id || 'new'] ?? true }));
                              setEditShowHeaderPointsSectionState((prev) => ({ ...prev, [subcategoryId]: editShowHeaderPointsSectionState[editSubcategory.id || 'new'] ?? true }));
                              setEditSubcategory(null);
                              toast.success('Subcategory added! Click the main Save button to persist changes.');
                            }}
                            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    </Modal>
                  )}
                </>
              ) : (
                <>
                  {/* Inline Edit Subcategory View */}
                  {(() => {
                    const editingSub = editSubs.find(s => s.id === editingSubcategoryId);
                    if (!editingSub) return null;
                    return (
                      <div className="rounded-2xl border border-border bg-card p-6 space-y-6">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <h2 className="text-xl font-bold">Edit Subcategory</h2>
                            <p className="text-sm text-muted-foreground">{editingSub.name}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setEditButtonsState(prev => ({ ...prev, [editingSub.id]: editButtons }));
                                setEditSubOverviewPointsState(prev => ({ ...prev, [editingSub.id]: editSubOverviewPoints }));
                                setEditSubBrandsState(prev => ({ ...prev, [editingSub.id]: editSubBrands }));
                                setEditingSubcategoryId(null);
                              }}
                              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted flex items-center gap-2"
                            >
                              <ArrowLeft className="w-4 h-4" />
                              Back
                            </button>
                            <button
                              onClick={async () => {
                                setEditButtonsState(prev => ({ ...prev, [editingSub.id]: editButtons }));
                                setEditSubOverviewPointsState(prev => ({ ...prev, [editingSub.id]: editSubOverviewPoints }));
                                setEditSubBrandsState(prev => ({ ...prev, [editingSub.id]: editSubBrands }));
                                setEditShowBrandsState(prev => ({ ...prev, [editingSub.id]: editShowBrandsState[editingSub.id] ?? true }));
                                setEditShowAboutSectionState(prev => ({ ...prev, [editingSub.id]: editShowAboutSectionState[editingSub.id] ?? true }));
                                setEditShowHeaderPointsSectionState(prev => ({ ...prev, [editingSub.id]: editShowHeaderPointsSectionState[editingSub.id] ?? true }));
                                setEditBrandsTabLabelState(prev => ({ ...prev, [editingSub.id]: editBrandsTabLabelState[editingSub.id] ?? 'Brands' }));
                                setEditKeyFeaturesTabLabelState(prev => ({ ...prev, [editingSub.id]: editKeyFeaturesTabLabelState[editingSub.id] ?? 'Key Features' }));
                                await saveCategory();
                                setEditingSubcategoryId(null);
                              }}
                              disabled={isSavingCategory}
                              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Save className="w-4 h-4" />
                              {isSavingCategory ? 'Saving...' : 'Save'}
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-1.5">Name</label>
                          <input
                            value={editingSub.name || ''}
                            onChange={(e) => {
                              setEditSubs(editSubs.map(s => s.id === editingSub.id ? { ...s, name: e.target.value } : s));
                            }}
                            className="w-full px-4 py-2.5 rounded-lg border border-input bg-background"
                          />
                        </div>



                        <div className="space-y-3 border-t pt-4">
                          <label className="block text-sm font-medium">Custom Redirect Link (Optional)</label>
                          <input
                            type="url"
                            value={editingSub.custom_link || ''}
                            onChange={(e) => {
                              setEditSubs(editSubs.map(s => s.id === editingSub.id ? { ...s, custom_link: e.target.value || undefined } : s));
                            }}
                            placeholder="https://example.com"
                            className="w-full px-4 py-2.5 rounded-lg border border-input bg-background"
                          />
                        </div>

                        {/* Buttons Section */}
                        <div className="space-y-4 border-t pt-4">
                          <h3 className="text-sm font-semibold text-foreground">Buttons</h3>

                          {/* Button 1 */}
                          <div className="space-y-3 p-4 border border-border rounded-xl bg-muted/30">
                            <div className="flex items-center justify-between gap-4">
                              <h4 className="text-sm font-medium">Button 1</h4>
                              <label className="flex items-center gap-2">
                                <Switch
                                  checked={editingSub.button_1_visible ?? false}
                                  onCheckedChange={(checked) => {
                                    setEditSubs(editSubs.map(s => s.id === editingSub.id ? { ...s, button_1_visible: Boolean(checked) } : s));
                                  }}
                                />
                                <span className="text-sm text-muted-foreground">Visible</span>
                              </label>
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1.5">Button Text</label>
                              <input
                                type="text"
                                value={editingSub.button_1_text || ''}
                                onChange={(e) => {
                                  setEditSubs(editSubs.map(s => s.id === editingSub.id ? { ...s, button_1_text: e.target.value || null } : s));
                                }}
                                placeholder="Button text"
                                className="w-full px-4 py-2.5 rounded-lg border border-input bg-background"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1.5">Button Link</label>
                              <input
                                type="url"
                                value={editingSub.button_1_link || ''}
                                onChange={(e) => {
                                  setEditSubs(editSubs.map(s => s.id === editingSub.id ? { ...s, button_1_link: e.target.value || null } : s));
                                }}
                                placeholder="https://example.com"
                                className="w-full px-4 py-2.5 rounded-lg border border-input bg-background"
                              />
                            </div>
                          </div>

                          {/* Button 2 */}
                          <div className="space-y-3 p-4 border border-border rounded-xl bg-muted/30">
                            <div className="flex items-center justify-between gap-4">
                              <h4 className="text-sm font-medium">Button 2</h4>
                              <label className="flex items-center gap-2">
                                <Switch
                                  checked={editingSub.button_2_visible ?? false}
                                  onCheckedChange={(checked) => {
                                    setEditSubs(editSubs.map(s => s.id === editingSub.id ? { ...s, button_2_visible: Boolean(checked) } : s));
                                  }}
                                />
                                <span className="text-sm text-muted-foreground">Visible</span>
                              </label>
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1.5">Button Text</label>
                              <input
                                type="text"
                                value={editingSub.button_2_text || ''}
                                onChange={(e) => {
                                  setEditSubs(editSubs.map(s => s.id === editingSub.id ? { ...s, button_2_text: e.target.value || null } : s));
                                }}
                                placeholder="Button text"
                                className="w-full px-4 py-2.5 rounded-lg border border-input bg-background"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1.5">Button Link</label>
                              <input
                                type="url"
                                value={editingSub.button_2_link || ''}
                                onChange={(e) => {
                                  setEditSubs(editSubs.map(s => s.id === editingSub.id ? { ...s, button_2_link: e.target.value || null } : s));
                                }}
                                placeholder="https://example.com"
                                className="w-full px-4 py-2.5 rounded-lg border border-input bg-background"
                              />
                            </div>
                          </div>

                          {/* Button 3 */}
                          <div className="space-y-3 p-4 border border-border rounded-xl bg-muted/30">
                            <div className="flex items-center justify-between gap-4">
                              <h4 className="text-sm font-medium">Button 3</h4>
                              <label className="flex items-center gap-2">
                                <Switch
                                  checked={editingSub.button_3_visible ?? false}
                                  onCheckedChange={(checked) => {
                                    setEditSubs(editSubs.map(s => s.id === editingSub.id ? { ...s, button_3_visible: Boolean(checked) } : s));
                                  }}
                                />
                                <span className="text-sm text-muted-foreground">Visible</span>
                              </label>
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1.5">Button Text</label>
                              <input
                                type="text"
                                value={editingSub.button_3_text || ''}
                                onChange={(e) => {
                                  setEditSubs(editSubs.map(s => s.id === editingSub.id ? { ...s, button_3_text: e.target.value || null } : s));
                                }}
                                placeholder="Button text"
                                className="w-full px-4 py-2.5 rounded-lg border border-input bg-background"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1.5">Button Link</label>
                              <input
                                type="url"
                                value={editingSub.button_3_link || ''}
                                onChange={(e) => {
                                  setEditSubs(editSubs.map(s => s.id === editingSub.id ? { ...s, button_3_link: e.target.value || null } : s));
                                }}
                                placeholder="https://example.com"
                                className="w-full px-4 py-2.5 rounded-lg border border-input bg-background"
                              />
                            </div>
                          </div>
                        </div>



                        <div className="border-t">
                          <button
                            type="button"
                            onClick={() => setActiveAccordion(activeAccordion === 'brands' ? null : 'brands')}
                            className="flex w-full items-center justify-between py-4 text-left hover:bg-muted/50 px-2 rounded-lg transition-colors"
                          >
                            <label className="text-lg font-bold cursor-pointer">Brands</label>
                            <ChevronDown className={`h-5 w-5 transition-transform ${activeAccordion === 'brands' ? 'rotate-180' : ''}`} />
                          </button>

                          {activeAccordion === 'brands' && !editingBrandId && (
                            <div className="space-y-4 pb-6 px-2">
                              <div>
                                <label className="block text-sm font-medium mb-2">Brands Tab Label</label>
                                <input
                                  value={editBrandsTabLabelState[editingSub.id] ?? 'Brands'}
                                  onChange={(e) => setEditBrandsTabLabelState({ ...editBrandsTabLabelState, [editingSub.id]: e.target.value })}
                                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                                  placeholder="Brands"
                                />
                              </div>

                              <div>
                                <div className="flex items-center justify-between mb-3">
                                  <label className="text-sm font-medium">Brands List</label>
                                  <button
                                    type="button"
                                    onClick={() => setEditSubBrands([...editSubBrands, {
                                      id: crypto.randomUUID(),
                                      name: '',
                                      logo_url: null,
                                      link: null,
                                      description: '',
                                      buttons: [],
                                      is_visible: true,
                                      action_link_1_text: null,
                                      action_link_1_url: null,
                                      action_link_1_new_tab: false,
                                      action_link_1_enabled: false,
                                      action_link_2_text: null,
                                      action_link_2_url: null,
                                      action_link_2_new_tab: false,
                                      action_link_2_enabled: false,
                                      action_link_3_text: null,
                                      action_link_3_url: null,
                                      action_link_3_new_tab: false,
                                      action_link_3_enabled: false,
                                      primary_cta_label: 'Submit RFP',
                                      primary_cta_link: '',
                                      primary_cta_visible: false,
                                      more_actions_label: 'Contact',
                                      more_actions_visible: false,
                                      join_network_label: '+ Join their Network',
                                      join_network_link: '',
                                      join_network_visible: false
                                    }])}
                                    disabled={editSubBrands.length >= 10}
                                    className="text-sm text-primary font-semibold hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    + Add Brand
                                  </button>
                                </div>

                                {editSubBrands.length === 0 ? (
                                  <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                                    No brands added yet.
                                  </div>
                                ) : (
                                  <DndContext
                                    sensors={sensors}
                                    collisionDetection={closestCenter}
                                    onDragEnd={handleBrandDragEnd}
                                  >
                                    <SortableContext
                                      items={editSubBrands.map(b => b.id!)}
                                      strategy={verticalListSortingStrategy}
                                    >
                                      <div className="space-y-3">
                                        {editSubBrands.map((brand) => (
                                          <SortableAdminItem key={brand.id} id={brand.id!}>
                                            <div className="flex flex-1 flex-col items-start gap-3 md:flex-row md:items-center md:justify-between">
                                              <div className="min-w-0">
                                                <p className="truncate font-semibold text-sm">{brand.name || 'Untitled brand'}</p>
                                                <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                                                  {(brand.action_links || []).length > 0 && (
                                                    <span>{(brand.action_links || []).length} action link{(brand.action_links || []).length !== 1 ? 's' : ''}</span>
                                                  )}
                                                </div>
                                              </div>
                                              <div className="flex items-center gap-2">
                                                <label className="flex items-center gap-1 rounded-lg border border-border bg-background px-2 py-1.5 text-xs font-medium text-muted-foreground">
                                                  <Switch
                                                    checked={brand.is_visible ?? true}
                                                    onCheckedChange={(checked) => {
                                                      const newBrands = editSubBrands.map(b =>
                                                        b.id === brand.id ? { ...b, is_visible: Boolean(checked) } : b
                                                      );
                                                      setEditSubBrands(newBrands);
                                                    }}
                                                  />
                                                  <span>{(brand.is_visible ?? true) ? 'Visible' : 'Hidden'}</span>
                                                </label>
                                                <button
                                                  type="button"
                                                  onClick={() => {
                                                    setEditingBrandId(brand.id || '');
                                                    setEditingBrand(brand);
                                                  }}
                                                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
                                                >
                                                  Edit
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={() => {
                                                    const newBrands = editSubBrands.filter(b => b.id !== brand.id);
                                                    setEditSubBrands(newBrands);
                                                    if (editingBrandId === brand.id) {
                                                      setEditingBrandId(null);
                                                      setEditingBrand(null);
                                                    }
                                                  }}
                                                  className="rounded-lg p-2 text-destructive hover:bg-destructive/10"
                                                >
                                                  <X className="w-4 h-4" />
                                                </button>
                                              </div>
                                            </div>
                                          </SortableAdminItem>
                                        ))}
                                      </div>
                                    </SortableContext>
                                  </DndContext>
                                )}
                              </div>
                            </div>
                          )}

                          {editingBrandId && editingBrand && (
                            <div className="rounded-2xl border border-border bg-card p-6 space-y-6 mt-4">
                              <div className="flex items-center justify-between gap-4">
                                <div>
                                  <h3 className="text-lg font-semibold">Edit Brand</h3>
                                  <p className="text-sm text-muted-foreground">{editingBrand.name || 'Untitled brand'}</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingBrandId(null);
                                    setEditingBrand(null);
                                  }}
                                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted flex items-center gap-2"
                                >
                                  <ArrowLeft className="w-4 h-4" /> Back to Brands
                                </button>
                              </div>

                              <div className="space-y-4">
                                <div>
                                  <label className="block text-sm font-medium mb-2">Brand Name</label>
                                  <input
                                    type="text"
                                    placeholder="Brand name"
                                    value={editingBrand.name || ''}
                                    onChange={(e) => {
                                      const updated = { ...editingBrand, name: e.target.value };
                                      setEditingBrand(updated);
                                      const idx = editSubBrands.findIndex(b => b.id === editingBrandId);
                                      if (idx !== -1) {
                                        const newBrands = [...editSubBrands];
                                        newBrands[idx] = updated as SubcategoryBrand;
                                        setEditSubBrands(newBrands);
                                      }
                                    }}
                                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                                  />
                                </div>

                                <div>
                                  <label className="block text-sm font-medium mb-2">Primary Link (optional)</label>
                                  <input
                                    type="text"
                                    placeholder="https://example.com"
                                    value={editingBrand.link || ''}
                                    onChange={(e) => {
                                      const updated = { ...editingBrand, link: e.target.value || null };
                                      setEditingBrand(updated);
                                      const idx = editSubBrands.findIndex(b => b.id === editingBrandId);
                                      if (idx !== -1) {
                                        const newBrands = [...editSubBrands];
                                        newBrands[idx] = updated as SubcategoryBrand;
                                        setEditSubBrands(newBrands);
                                      }
                                    }}
                                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                                  />
                                </div>

                                <div>
                                  <label className="flex items-center gap-2 text-sm font-medium">
                                    <Switch
                                      checked={editingBrand.is_visible ?? true}
                                      onCheckedChange={(checked) => {
                                        const updated = { ...editingBrand, is_visible: Boolean(checked) };
                                        setEditingBrand(updated);
                                        const idx = editSubBrands.findIndex(b => b.id === editingBrandId);
                                        if (idx !== -1) {
                                          const newBrands = [...editSubBrands];
                                          newBrands[idx] = updated as SubcategoryBrand;
                                          setEditSubBrands(newBrands);
                                        }
                                      }}
                                    />
                                    <span>Visible</span>
                                  </label>
                                </div>

                                <div className="border-t pt-4">
                                  <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-sm font-semibold">Brand Action Links</h4>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const updated = {
                                          ...editingBrand,
                                          action_links: [
                                            ...(editingBrand.action_links || []),
                                            {
                                              id: crypto.randomUUID(),
                                              text: '',
                                              url: '',
                                              new_tab: false,
                                              enabled: true,
                                            },
                                          ],
                                        };
                                        setEditingBrand(updated);
                                        const idx = editSubBrands.findIndex(b => b.id === editingBrandId);
                                        if (idx !== -1) {
                                          const newBrands = [...editSubBrands];
                                          newBrands[idx] = updated as SubcategoryBrand;
                                          setEditSubBrands(newBrands);
                                        }
                                      }}
                                      className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
                                    >
                                      <Plus className="w-4 h-4" /> Add Link
                                    </button>
                                  </div>

                                  {(editingBrand.action_links || []).length === 0 ? (
                                    <p className="text-sm text-muted-foreground">No action links added yet.</p>
                                  ) : (
                                    <div className="space-y-3">
                                      {(editingBrand.action_links || []).map((link, linkIdx) => (
                                        <div key={link.id || linkIdx} className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
                                          <div className="flex items-center justify-between gap-2">
                                            <span className="text-sm font-medium">Link {linkIdx + 1}</span>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                const updated = {
                                                  ...editingBrand,
                                                  action_links: (editingBrand.action_links || []).filter((_, i) => i !== linkIdx),
                                                };
                                                setEditingBrand(updated);
                                                const idx = editSubBrands.findIndex(b => b.id === editingBrandId);
                                                if (idx !== -1) {
                                                  const newBrands = [...editSubBrands];
                                                  newBrands[idx] = updated as SubcategoryBrand;
                                                  setEditSubBrands(newBrands);
                                                }
                                              }}
                                              className="p-1 text-destructive hover:bg-destructive/10 rounded"
                                            >
                                              <Trash2 className="w-4 h-4" />
                                            </button>
                                          </div>

                                          <div className="space-y-2">
                                            <input
                                              type="text"
                                              placeholder="Link text"
                                              value={link.text || ''}
                                              onChange={(e) => {
                                                const updatedLinks = [...(editingBrand.action_links || [])];
                                                updatedLinks[linkIdx] = { ...link, text: e.target.value || null };
                                                const updated = { ...editingBrand, action_links: updatedLinks };
                                                setEditingBrand(updated);
                                                const idx = editSubBrands.findIndex(b => b.id === editingBrandId);
                                                if (idx !== -1) {
                                                  const newBrands = [...editSubBrands];
                                                  newBrands[idx] = updated as SubcategoryBrand;
                                                  setEditSubBrands(newBrands);
                                                }
                                              }}
                                              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                                            />

                                            <input
                                              type="text"
                                              placeholder="Link URL"
                                              value={link.url || ''}
                                              onChange={(e) => {
                                                const updatedLinks = [...(editingBrand.action_links || [])];
                                                updatedLinks[linkIdx] = { ...link, url: e.target.value || null };
                                                const updated = { ...editingBrand, action_links: updatedLinks };
                                                setEditingBrand(updated);
                                                const idx = editSubBrands.findIndex(b => b.id === editingBrandId);
                                                if (idx !== -1) {
                                                  const newBrands = [...editSubBrands];
                                                  newBrands[idx] = updated as SubcategoryBrand;
                                                  setEditSubBrands(newBrands);
                                                }
                                              }}
                                              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                                            />

                                            <div className="flex items-center gap-2">
                                              <label className="flex items-center gap-1 text-sm text-muted-foreground flex-1">
                                                <input
                                                  type="checkbox"
                                                  checked={link.new_tab ?? false}
                                                  onChange={(e) => {
                                                    const updatedLinks = [...(editingBrand.action_links || [])];
                                                    updatedLinks[linkIdx] = { ...link, new_tab: e.target.checked };
                                                    const updated = { ...editingBrand, action_links: updatedLinks };
                                                    setEditingBrand(updated);
                                                    const idx = editSubBrands.findIndex(b => b.id === editingBrandId);
                                                    if (idx !== -1) {
                                                      const newBrands = [...editSubBrands];
                                                      newBrands[idx] = updated as SubcategoryBrand;
                                                      setEditSubBrands(newBrands);
                                                    }
                                                  }}
                                                />
                                                Open in new tab
                                              </label>

                                              <div className="flex items-center gap-1">
                                                <Switch
                                                  checked={link.enabled ?? true}
                                                  onCheckedChange={(checked) => {
                                                    const updatedLinks = [...(editingBrand.action_links || [])];
                                                    updatedLinks[linkIdx] = { ...link, enabled: checked };
                                                    const updated = { ...editingBrand, action_links: updatedLinks };
                                                    setEditingBrand(updated);
                                                    const idx = editSubBrands.findIndex(b => b.id === editingBrandId);
                                                    if (idx !== -1) {
                                                      const newBrands = [...editSubBrands];
                                                      newBrands[idx] = updated as SubcategoryBrand;
                                                      setEditSubBrands(newBrands);
                                                    }
                                                  }}
                                                />
                                                <span className="text-[10px] font-medium uppercase text-muted-foreground whitespace-nowrap">{link.enabled ?? true ? 'On' : 'Off'}</span>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="hidden">
                          <button
                            type="button"
                            onClick={() => setActiveAccordion(activeAccordion === 'about-sections' ? null : 'about-sections')}
                            className="flex w-full items-center justify-between py-4 text-left hover:bg-muted/50 px-2 rounded-lg transition-colors"
                          >
                            <label className="text-lg font-bold cursor-pointer">About Sections</label>
                            <ChevronDown className={`h-5 w-5 transition-transform ${activeAccordion === 'about-sections' ? 'rotate-180' : ''}`} />
                          </button>

                          {activeAccordion === 'about-sections' && (
                            <div className="space-y-4 pb-6 px-2">
                              <div className="flex items-center justify-between mb-4">
                                <label className="text-sm font-medium">Manage multiple about content sections</label>
                                <button
                                  type="button"
                                  onClick={() => addAboutSection(editingSub.id)}
                                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                                >
                                  <Plus className="h-4 w-4" /> Add More
                                </button>
                              </div>

                              {(editAboutSections[editingSub.id] || []).length === 0 ? (
                                <p className="text-sm text-muted-foreground py-4">No About sections added yet. Click "Add More" to create your first About section.</p>
                              ) : (
                                <div className="space-y-3">
                                  {(editAboutSections[editingSub.id] || []).map((section, index) => (
                                    <div key={section.id} className="w-full space-y-3" style={{ backgroundColor: section.background_color || '#ffffff', padding: '16px', borderRadius: '8px' }}>
                                      <div className="flex items-center justify-between gap-3">
                                        <input
                                          value={section.heading}
                                          onChange={(e) => updateAboutSection(editingSub.id, section.id, { heading: e.target.value })}
                                          className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-sm"
                                          placeholder="About heading"
                                        />
                                        <div className="flex items-center gap-2">
                                          <Switch
                                            checked={editAboutSectionVisibility[editingSub.id]?.[section.id] ?? true}
                                            onCheckedChange={(value) => setEditAboutSectionVisibility(prev => ({
                                              ...prev,
                                              [editingSub.id]: {
                                                ...(prev[editingSub.id] || {}),
                                                [section.id]: value
                                              }
                                            }))}
                                          />
                                          <button
                                            type="button"
                                            onClick={() => deleteAboutSection(editingSub.id, section.id)}
                                            className="text-destructive hover:text-destructive/80 p-1"
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </button>
                                        </div>
                                      </div>
                                      {editAboutSectionVisibility[editingSub.id]?.[section.id] !== false && (
                                        <>
                                          <div className="flex items-center gap-3">
                                            <label className="text-sm text-muted-foreground">Background:</label>
                                            <input
                                              type="color"
                                              value={section.background_color || '#ffffff'}
                                              onChange={(e) => updateAboutSection(editingSub.id, section.id, { background_color: e.target.value })}
                                              className="w-10 h-10 rounded cursor-pointer border border-input"
                                            />
                                            <label className="text-sm text-muted-foreground ml-4">Logo BG Color:</label>
                                            <input
                                              type="color"
                                              value={section.heading_color || '#000000'}
                                              onChange={(e) => updateAboutSection(editingSub.id, section.id, { heading_color: e.target.value })}
                                              className="w-10 h-10 rounded cursor-pointer border border-input"
                                            />
                                          </div>
                                          <CKEditor
                                            key={section.id}
                                            value={section.content || ''}
                                            onChange={createAboutSectionChangeHandler(editingSub.id, section.id)}
                                            className="min-h-[100px] w-full"
                                            placeholder="Enter about section content here..."
                                          />
                                        </>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="hidden">
                          <button
                            type="button"
                            onClick={() => setActiveAccordion(activeAccordion === 'key-features' ? null : 'key-features')}
                            className="flex w-full items-center justify-between py-4 text-left hover:bg-muted/50 px-2 rounded-lg transition-colors"
                          >
                            <label className="text-lg font-bold cursor-pointer">Key Features Tab</label>
                            <ChevronDown className={`h-5 w-5 transition-transform ${activeAccordion === 'key-features' ? 'rotate-180' : ''}`} />
                          </button>

                          {activeAccordion === 'key-features' && (
                            <div className="space-y-4 pb-6 px-2">
                              <div className="space-y-3 border-b pb-6">
                                <div className="flex items-center justify-between">
                                  <label className="block text-sm font-medium">Enable Key Features Tab</label>
                                  <Switch
                                    checked={editShowHeaderPointsSectionState[editingSub.id] ?? true}
                                    onCheckedChange={(value) => setEditShowHeaderPointsSectionState({ ...editShowHeaderPointsSectionState, [editingSub.id]: value })}
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium mb-1.5">Tab Label</label>
                                  <input
                                    value={editKeyFeaturesTabLabelState[editingSub.id] ?? 'Key Features'}
                                    onChange={(e) => setEditKeyFeaturesTabLabelState({ ...editKeyFeaturesTabLabelState, [editingSub.id]: e.target.value })}
                                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                                    placeholder="Key Features"
                                  />
                                </div>
                              </div>

                              <div className="flex items-center justify-between mb-4">
                                <button
                                  type="button"
                                  onClick={() => addKeyFeaturesSection(editingSub.id)}
                                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                                >
                                  <Plus className="h-4 w-4" /> Add More
                                </button>
                              </div>

                              {(editKeyFeaturesSections[editingSub.id] || []).length === 0 ? (
                                <p className="text-sm text-muted-foreground py-4">No Key Features sections added yet. Click "Add More" to create your first section.</p>
                              ) : (
                                <div className="space-y-6">
                                  {(editKeyFeaturesSections[editingSub.id] || []).map((section, sectionIndex) => (
                                    <div key={section.id} className="w-full space-y-4 rounded-xl border border-border bg-card p-4 shadow-sm">
                                      <div className="flex items-center justify-between gap-3">
                                        <input
                                          value={section.heading}
                                          onChange={(e) => updateKeyFeaturesSection(editingSub.id, section.id, { heading: e.target.value })}
                                          className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-sm font-bold"
                                          placeholder="Section heading (e.g., Key Features)"
                                        />
                                        <div className="flex items-center gap-2">
                                          <Switch
                                            checked={section.is_visible}
                                            onCheckedChange={(value) => updateKeyFeaturesSection(editingSub.id, section.id, { is_visible: value })}
                                          />
                                          <button
                                            type="button"
                                            onClick={() => deleteKeyFeaturesSection(editingSub.id, section.id)}
                                            className="text-destructive hover:text-destructive/80 p-1"
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </button>
                                        </div>
                                      </div>

                                      {section.is_visible && (
                                        <div className="space-y-3 pl-4 border-l-2 border-primary/20">
                                          {editSubOverviewPoints
                                            .filter(p => p.section_id === section.id)
                                            .map((point, pointIndex) => {
                                              return (
                                                <div key={point.id || pointIndex} className="flex flex-col gap-3 rounded-lg border border-border bg-muted/30 p-3">
                                                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                                                    <input
                                                      type="text"
                                                      value={point.text}
                                                      onChange={(e) => {
                                                        const newPoints = [...editSubOverviewPoints];
                                                        const pointToUpdateIdx = newPoints.findIndex(p => p.id === point.id);
                                                        if (pointToUpdateIdx !== -1) {
                                                          newPoints[pointToUpdateIdx] = { ...newPoints[pointToUpdateIdx], text: e.target.value };
                                                          setEditSubOverviewPoints(newPoints);
                                                        }
                                                      }}
                                                      placeholder={`Point ${pointIndex + 1}`}
                                                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                                                    />
                                                    <div className="flex items-center gap-3">
                                                      <div className="flex items-center gap-2">
                                                        <button
                                                          type="button"
                                                          onClick={() => {
                                                            const newPoints = [...editSubOverviewPoints];
                                                            const pointToUpdateIdx = newPoints.findIndex(p => p.id === point.id);
                                                            if (pointToUpdateIdx !== -1) {
                                                              newPoints[pointToUpdateIdx] = { ...newPoints[pointToUpdateIdx], highlight_color: 'green' };
                                                              setEditSubOverviewPoints(newPoints);
                                                            }
                                                          }}
                                                          className={`h-7 w-7 rounded-full border-2 ${point.highlight_color !== 'blue' ? 'border-emerald-700 ring-2 ring-emerald-200' : 'border-border'}`}
                                                          style={{ backgroundColor: '#10b981' }}
                                                        />
                                                        <button
                                                          type="button"
                                                          onClick={() => {
                                                            const newPoints = [...editSubOverviewPoints];
                                                            const pointToUpdateIdx = newPoints.findIndex(p => p.id === point.id);
                                                            if (pointToUpdateIdx !== -1) {
                                                              newPoints[pointToUpdateIdx] = { ...newPoints[pointToUpdateIdx], highlight_color: 'blue' };
                                                              setEditSubOverviewPoints(newPoints);
                                                            }
                                                          }}
                                                          className={`h-7 w-7 rounded-full border-2 ${point.highlight_color === 'blue' ? 'border-blue-700 ring-2 ring-blue-200' : 'border-border'}`}
                                                          style={{ backgroundColor: '#2563eb' }}
                                                        />
                                                      </div>
                                                      <div className="flex items-center gap-2 border-l pl-3">
                                                        <label className="text-xs text-muted-foreground">Highlight</label>
                                                        <Switch
                                                          checked={point.is_highlighted}
                                                          onCheckedChange={(value) => {
                                                            const newPoints = [...editSubOverviewPoints];
                                                            const pointToUpdateIdx = newPoints.findIndex(p => p.id === point.id);
                                                            if (pointToUpdateIdx !== -1) {
                                                              newPoints[pointToUpdateIdx] = { ...newPoints[pointToUpdateIdx], is_highlighted: value };
                                                              setEditSubOverviewPoints(newPoints);
                                                            }
                                                          }}
                                                        />
                                                      </div>
                                                      <button
                                                        type="button"
                                                        onClick={() => {
                                                          const newPoints = editSubOverviewPoints.filter(p => p.id !== point.id);
                                                          setEditSubOverviewPoints(newPoints);
                                                        }}
                                                        className="rounded-lg p-2 text-destructive hover:bg-destructive/10"
                                                      >
                                                        <Trash2 className="w-4 h-4" />
                                                      </button>
                                                    </div>
                                                  </div>
                                                </div>
                                              );
                                            })}
                                          <button
                                            type="button"
                                            onClick={() => setEditSubOverviewPoints([...editSubOverviewPoints, { id: crypto.randomUUID(), subcategory_id: editingSub.id, section_id: section.id, text: '', is_highlighted: false, highlight_color: 'green', sort_order: editSubOverviewPoints.filter(p => p.section_id === section.id).length }])}
                                            className="flex items-center gap-2 text-sm text-primary font-semibold hover:underline"
                                          >
                                            <Plus className="w-4 h-4" /> Add Point
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="hidden">
                          <button
                            type="button"
                            onClick={() => setActiveAccordion(activeAccordion === 'buttons' ? null : 'buttons')}
                            className="flex w-full items-center justify-between py-4 text-left hover:bg-muted/50 px-2 rounded-lg transition-colors"
                          >
                            <label className="text-lg font-bold cursor-pointer">Buttons</label>
                            <ChevronDown className={`h-5 w-5 transition-transform ${activeAccordion === 'buttons' ? 'rotate-180' : ''}`} />
                          </button>

                          {activeAccordion === 'buttons' && (
                            <div className="space-y-4 pb-6 px-2">
                              <p className="text-sm text-muted-foreground">Add up to 4 custom buttons for this subcategory.</p>
                              {editButtons.length > 0 && (
                                <div className="grid gap-4 sm:grid-cols-2">
                                  {editButtons.map((button, index) => (
                                    <div key={button.id || index} className="rounded-3xl border border-border bg-card p-4 shadow-sm">
                                      <div className="flex items-center justify-between gap-3">
                                        <input
                                          type="text"
                                          value={button.label}
                                          onChange={(e) => {
                                            const newButtons = [...editButtons];
                                            newButtons[index] = { ...newButtons[index], label: e.target.value };
                                            setEditButtons(newButtons);
                                          }}
                                          placeholder="Button label"
                                          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                                        />
                                        <Switch
                                          checked={button.is_visible ?? false}
                                          onCheckedChange={(value) => {
                                            const newButtons = [...editButtons];
                                            newButtons[index] = { ...newButtons[index], is_visible: value };
                                            setEditButtons(newButtons);
                                          }}
                                          className="shrink-0"
                                        />
                                      </div>
                                      <input
                                        type="text"
                                        value={button.link || ''}
                                        onChange={(e) => {
                                          const newButtons = [...editButtons];
                                          newButtons[index] = { ...newButtons[index], link: e.target.value || null };
                                          setEditButtons(newButtons);
                                        }}
                                        placeholder="Button link"
                                        className="mt-3 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                                      />
                                      <p className="mt-2 text-xs text-muted-foreground">{button.is_visible ? 'Visible' : 'Hidden'}</p>
                                    </div>
                                  ))}
                                </div>
                              )}
                              {editButtons.length < 4 && (
                                <button
                                  type="button"
                                  onClick={() => setEditButtons([...editButtons, { id: crypto.randomUUID(), label: '', link: null, is_visible: true }])}
                                  className="flex items-center gap-2 text-sm text-primary font-semibold hover:underline"
                                >
                                  <Plus className="w-4 h-4" /> Add Button
                                </button>
                              )}
                            </div>
                          )}
                        </div>







                        {productShowAddSectionModal && (
                          <Modal title="Add Subcategory Section" onClose={() => setProductShowAddSectionModal(false)}>
                            <div className="space-y-3">
                              <select value={productAddSectionType} onChange={(e) => setProductAddSectionType(e.target.value as ProductAdminTab)} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                                {PRODUCT_SECTION_TYPE_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                              </select>
                              <input value={productAddSectionName} onChange={(e) => setProductAddSectionName(e.target.value)} placeholder="Section name (optional)" className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
                              <button type="button" onClick={() => productHandleAddSection(editingSub.id)} className="w-full rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground">Create</button>
                            </div>
                          </Modal>
                        )}
                        {productHeadingModalSectionId && (
                          <Modal title="Edit Section Heading" onClose={() => setProductHeadingModalSectionId('')}>
                            <div className="space-y-3">
                              <input value={productHeadingModalValue} onChange={(e) => setProductHeadingModalValue(e.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
                              <label className="flex items-center gap-2 text-sm">
                                <Switch checked={productHeadingVisible} onCheckedChange={(checked) => setProductHeadingVisible(Boolean(checked))} />
                                <span>Show heading</span>
                              </label>
                              <div>
                                <label className="block text-sm font-medium mb-2">Background Color</label>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="color"
                                    value={productHeadingBackgroundColor || '#ffffff'}
                                    onChange={(e) => setProductHeadingBackgroundColor(e.target.value)}
                                    className="h-10 w-16 rounded cursor-pointer border border-input"
                                  />
                                  <input
                                    type="text"
                                    value={productHeadingBackgroundColor || ''}
                                    onChange={(e) => setProductHeadingBackgroundColor(e.target.value)}
                                    placeholder="#ffffff or leave empty for default"
                                    className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm"
                                  />
                                </div>
                              </div>
                              <button type="button" onClick={() => productSaveHeadingModal(productHeadingModalSectionId, editingSub.id)} className="w-full rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground">Save</button>
                            </div>
                          </Modal>
                        )}
                        {productEditCard && (
                          <Modal title={productEditCard.id ? 'Edit Card' : 'Add Card'} onClose={() => setProductEditCard(null)}>
                            <div className="space-y-3">
                              <ImageUpload label="Logo" value={productEditCard.logo_url || null} onChange={(url) => setProductEditCard({ ...productEditCard, logo_url: url })} folder="cards" />
                              <input value={productEditCard.title || ''} onChange={(e) => setProductEditCard({ ...productEditCard, title: e.target.value })} placeholder="Title" className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
                              <CKEditor value={productEditCard.description || ''} onChange={(value) => setProductEditCard({ ...productEditCard, description: value })} placeholder="Description" className="min-h-[100px]" />
                              <input value={productEditCard.link || ''} onChange={(e) => setProductEditCard({ ...productEditCard, link: e.target.value || null })} placeholder="Link (optional)" className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
                              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Switch checked={productEditCard.show_border ?? false} onCheckedChange={(checked) => setProductEditCard({ ...productEditCard, show_border: Boolean(checked) })} />
                                <span>Enable Border</span>
                              </label>
                              {productEditCard.show_border && (
                                <div>
                                  <label className="block text-sm font-medium mb-1.5">Border Color</label>
                                  <div className="flex items-center gap-3">
                                    <input
                                      type="color"
                                      value={productEditCard.border_color || '#000000'}
                                      onChange={(e) => setProductEditCard({ ...productEditCard, border_color: e.target.value })}
                                      className="h-10 w-20 rounded cursor-pointer border-0"
                                    />
                                    <input
                                      type="text"
                                      value={productEditCard.border_color || ''}
                                      onChange={(e) => setProductEditCard({ ...productEditCard, border_color: e.target.value || null })}
                                      placeholder="#000000"
                                      className="flex-1 px-3 py-2 rounded-lg border border-input bg-background"
                                    />
                                  </div>
                                </div>
                              )}
                              <div>
                                <label className="block text-sm font-medium mb-1.5">Card Background Color</label>
                                <div className="flex items-center gap-3">
                                  <input
                                    type="color"
                                    value={productEditCard.background_color || '#fcf9f5'}
                                    onChange={(e) => setProductEditCard({ ...productEditCard, background_color: e.target.value })}
                                    className="h-10 w-20 rounded cursor-pointer border-0"
                                  />
                                  <input
                                    type="text"
                                    value={productEditCard.background_color || ''}
                                    onChange={(e) => setProductEditCard({ ...productEditCard, background_color: e.target.value || null })}
                                    placeholder="#fcf9f5"
                                    className="flex-1 px-3 py-2 rounded-lg border border-input bg-background"
                                  />
                                </div>
                              </div>
                              <button type="button" onClick={() => productSaveCard(editingSub.id)} className="w-full rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground">Save</button>
                            </div>
                          </Modal>
                        )}
                        {productEditOffer && (
                          <Modal title={productEditOffer.id ? 'Edit Offer' : 'Add Offer'} onClose={() => setProductEditOffer(null)}>
                            <div className="space-y-3">
                              <ImageUpload label="Image" value={productEditOffer.image_url || null} onChange={(url) => setProductEditOffer({ ...productEditOffer, image_url: url })} folder="offers" />
                              <input value={productEditOffer.heading || ''} onChange={(e) => setProductEditOffer({ ...productEditOffer, heading: e.target.value })} placeholder="Heading (optional)" className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
                              <CKEditor value={productEditOffer.description || ''} onChange={(value) => setProductEditOffer({ ...productEditOffer, description: value || null })} placeholder="Description (optional)" className="min-h-[100px]" />
                              <input value={productEditOffer.link || ''} onChange={(e) => setProductEditOffer({ ...productEditOffer, link: e.target.value || null })} placeholder="Link (optional)" className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
                              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Switch checked={productEditOffer.show_border ?? false} onCheckedChange={(checked) => setProductEditOffer({ ...productEditOffer, show_border: Boolean(checked) })} />
                                <span>Enable Border</span>
                              </label>
                              {productEditOffer.show_border && (
                                <div>
                                  <label className="block text-sm font-medium mb-1.5">Border Color</label>
                                  <div className="flex items-center gap-3">
                                    <input
                                      type="color"
                                      value={productEditOffer.border_color || '#000000'}
                                      onChange={(e) => setProductEditOffer({ ...productEditOffer, border_color: e.target.value })}
                                      className="h-10 w-20 rounded cursor-pointer border-0"
                                    />
                                    <input
                                      type="text"
                                      value={productEditOffer.border_color || ''}
                                      onChange={(e) => setProductEditOffer({ ...productEditOffer, border_color: e.target.value || null })}
                                      placeholder="#000000"
                                      className="flex-1 px-3 py-2 rounded-lg border border-input bg-background"
                                    />
                                  </div>
                                </div>
                              )}
                              <div>
                                <label className="block text-sm font-medium mb-1.5">Container Background Color</label>
                                <div className="flex items-center gap-3">
                                  <input
                                    type="color"
                                    value={productEditOffer.background_color || '#f3f4f6'}
                                    onChange={(e) => setProductEditOffer({ ...productEditOffer, background_color: e.target.value })}
                                    className="h-10 w-20 rounded cursor-pointer border-0"
                                  />
                                  <input
                                    type="text"
                                    value={productEditOffer.background_color || ''}
                                    onChange={(e) => setProductEditOffer({ ...productEditOffer, background_color: e.target.value || null })}
                                    placeholder="#f3f4f6"
                                    className="flex-1 px-3 py-2 rounded-lg border border-input bg-background"
                                  />
                                </div>
                              </div>
                              <button type="button" onClick={() => productSaveOffer(editingSub.id)} className="w-full rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground">Save</button>
                            </div>
                          </Modal>
                        )}
                        {productEditAd1 && (
                          <Modal title={productEditAd1.id ? 'Edit Ad 1' : 'Add Ad 1'} onClose={() => setProductEditAd1(null)}>
                            <div className="space-y-3">
                              <ImageUpload label="Image" value={productEditAd1.image_url || null} onChange={(url) => setProductEditAd1({ ...productEditAd1, image_url: url })} folder="ads" />
                              <input value={productEditAd1.link || ''} onChange={(e) => setProductEditAd1({ ...productEditAd1, link: e.target.value || null })} placeholder="Link (optional)" className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
                              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Switch checked={productEditAd1.show_border ?? false} onCheckedChange={(checked) => setProductEditAd1({ ...productEditAd1, show_border: Boolean(checked) })} />
                                <span>Enable Border</span>
                              </label>
                              {productEditAd1.show_border && (
                                <div>
                                  <label className="block text-sm font-medium mb-1.5">Border Color</label>
                                  <div className="flex items-center gap-3">
                                    <input
                                      type="color"
                                      value={productEditAd1.border_color || '#000000'}
                                      onChange={(e) => setProductEditAd1({ ...productEditAd1, border_color: e.target.value })}
                                      className="h-10 w-20 rounded cursor-pointer border-0"
                                    />
                                    <input
                                      type="text"
                                      value={productEditAd1.border_color || ''}
                                      onChange={(e) => setProductEditAd1({ ...productEditAd1, border_color: e.target.value || null })}
                                      placeholder="#000000"
                                      className="flex-1 px-3 py-2 rounded-lg border border-input bg-background"
                                    />
                                  </div>
                                </div>
                              )}
                              <div>
                                <label className="block text-sm font-medium mb-1.5">Container Background Color</label>
                                <div className="flex items-center gap-3">
                                  <input
                                    type="color"
                                    value={productEditAd1.background_color || '#f3f4f6'}
                                    onChange={(e) => setProductEditAd1({ ...productEditAd1, background_color: e.target.value })}
                                    className="h-10 w-20 rounded cursor-pointer border-0"
                                  />
                                  <input
                                    type="text"
                                    value={productEditAd1.background_color || ''}
                                    onChange={(e) => setProductEditAd1({ ...productEditAd1, background_color: e.target.value || null })}
                                    placeholder="#f3f4f6"
                                    className="flex-1 px-3 py-2 rounded-lg border border-input bg-background"
                                  />
                                </div>
                              </div>
                              <button type="button" onClick={() => productSaveAd1(editingSub.id)} className="w-full rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground">Save</button>
                            </div>
                          </Modal>
                        )}
                        {productEditAd2 && (
                          <Modal title={productEditAd2.id ? 'Edit Ad 2' : 'Add Ad 2'} onClose={() => setProductEditAd2(null)}>
                            <div className="space-y-3">
                              <ImageUpload label="Image" value={productEditAd2.image_url || null} onChange={(url) => setProductEditAd2({ ...productEditAd2, image_url: url })} folder="ads" />
                              <input value={productEditAd2.link || ''} onChange={(e) => setProductEditAd2({ ...productEditAd2, link: e.target.value || null })} placeholder="Link (optional)" className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
                              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Switch checked={productEditAd2.show_border ?? false} onCheckedChange={(checked) => setProductEditAd2({ ...productEditAd2, show_border: Boolean(checked) })} />
                                <span>Enable Border</span>
                              </label>
                              {productEditAd2.show_border && (
                                <div>
                                  <label className="block text-sm font-medium mb-1.5">Border Color</label>
                                  <div className="flex items-center gap-3">
                                    <input
                                      type="color"
                                      value={productEditAd2.border_color || '#000000'}
                                      onChange={(e) => setProductEditAd2({ ...productEditAd2, border_color: e.target.value })}
                                      className="h-10 w-20 rounded cursor-pointer border-0"
                                    />
                                    <input
                                      type="text"
                                      value={productEditAd2.border_color || ''}
                                      onChange={(e) => setProductEditAd2({ ...productEditAd2, border_color: e.target.value || null })}
                                      placeholder="#000000"
                                      className="flex-1 px-3 py-2 rounded-lg border border-input bg-background"
                                    />
                                  </div>
                                </div>
                              )}
                              <div>
                                <label className="block text-sm font-medium mb-1.5">Container Background Color</label>
                                <div className="flex items-center gap-3">
                                  <input
                                    type="color"
                                    value={productEditAd2.background_color || '#f3f4f6'}
                                    onChange={(e) => setProductEditAd2({ ...productEditAd2, background_color: e.target.value })}
                                    className="h-10 w-20 rounded cursor-pointer border-0"
                                  />
                                  <input
                                    type="text"
                                    value={productEditAd2.background_color || ''}
                                    onChange={(e) => setProductEditAd2({ ...productEditAd2, background_color: e.target.value || null })}
                                    placeholder="#f3f4f6"
                                    className="flex-1 px-3 py-2 rounded-lg border border-input bg-background"
                                  />
                                </div>
                              </div>
                              <button type="button" onClick={() => productSaveAd2(editingSub.id)} className="w-full rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground">Save</button>
                            </div>
                          </Modal>
                        )}
                        {productEditAd3 && (
                          <Modal title={productEditAd3.id ? 'Edit Ad 3' : 'Add Ad 3'} onClose={() => setProductEditAd3(null)}>
                            <div className="space-y-3">
                              <ImageUpload label="Image" value={productEditAd3.image_url || null} onChange={(url) => setProductEditAd3({ ...productEditAd3, image_url: url })} folder="ads" />
                              <input value={productEditAd3.heading || ''} onChange={(e) => setProductEditAd3({ ...productEditAd3, heading: e.target.value || null })} placeholder="Heading (optional)" className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
                              <CKEditor value={productEditAd3.description || ''} onChange={(value) => setProductEditAd3({ ...productEditAd3, description: value || null })} placeholder="Description (optional)" className="min-h-[100px]" />
                              <input value={productEditAd3.link || ''} onChange={(e) => setProductEditAd3({ ...productEditAd3, link: e.target.value || null })} placeholder="Link (optional)" className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
                              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Switch checked={productEditAd3.show_border ?? false} onCheckedChange={(checked) => setProductEditAd3({ ...productEditAd3, show_border: Boolean(checked) })} />
                                <span>Enable Border</span>
                              </label>
                              {productEditAd3.show_border && (
                                <div>
                                  <label className="block text-sm font-medium mb-1.5">Border Color</label>
                                  <div className="flex items-center gap-3">
                                    <input
                                      type="color"
                                      value={productEditAd3.border_color || '#000000'}
                                      onChange={(e) => setProductEditAd3({ ...productEditAd3, border_color: e.target.value })}
                                      className="h-10 w-20 rounded cursor-pointer border-0"
                                    />
                                    <input
                                      type="text"
                                      value={productEditAd3.border_color || ''}
                                      onChange={(e) => setProductEditAd3({ ...productEditAd3, border_color: e.target.value || null })}
                                      placeholder="#000000"
                                      className="flex-1 px-3 py-2 rounded-lg border border-input bg-background"
                                    />
                                  </div>
                                </div>
                              )}
                              <div>
                                <label className="block text-sm font-medium mb-1.5">Container Background Color</label>
                                <div className="flex items-center gap-3">
                                  <input
                                    type="color"
                                    value={productEditAd3.background_color || '#f3f4f6'}
                                    onChange={(e) => setProductEditAd3({ ...productEditAd3, background_color: e.target.value })}
                                    className="h-10 w-20 rounded cursor-pointer border-0"
                                  />
                                  <input
                                    type="text"
                                    value={productEditAd3.background_color || ''}
                                    onChange={(e) => setProductEditAd3({ ...productEditAd3, background_color: e.target.value || null })}
                                    placeholder="#f3f4f6"
                                    className="flex-1 px-3 py-2 rounded-lg border border-input bg-background"
                                  />
                                </div>
                              </div>
                              <button type="button" onClick={() => productSaveAd3(editingSub.id)} className="w-full rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground">Save</button>
                            </div>
                          </Modal>
                        )}

                      </div>
                    );
                  })()}
                </>
              )}
            </div>
          )}

          {/* OFFERS */}
          {tab === 'offers' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Offers & Discounts</h2>
                <button
                  onClick={() => {
                    setAddSectionType('offers');
                    setShowAddSectionModal(true);
                  }}
                  className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold flex items-center gap-1.5 hover:bg-green-700"
                >
                  <Plus className="w-4 h-4" /> Add New Section
                </button>
              </div>

              {/* Section instances tabs */}
              {sections.filter(s => s.section_type === 'offers').length > 0 && (
                <div className="mb-6 hidden md:block">
                  <div className="flex gap-2 flex-wrap mb-4 overflow-x-auto pb-2">
                    {sections.filter(s => s.section_type === 'offers').map(section => (
                      <button
                        key={section.id}
                        onClick={() => setSelectedOffersSectionId(section.id)}
                        className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${selectedOffersSectionId === section.id
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-card border border-border text-foreground hover:bg-muted'
                          }`}
                      >
                        {getSectionDisplayName(section)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
                <div className="flex flex-col gap-2">
                  <p className="text-xs md:text-sm text-muted-foreground">
                    {selectedOffersSectionId ? `Adding offers to: ${getSectionDisplayName(selectedOffersSection)}` : 'No section selected'}
                  </p>
                  {selectedOffersSection && (
                    <div className="flex flex-wrap gap-2">
                      <label className="flex items-center gap-2 text-sm">
                        <Switch
                          checked={selectedOffersSection.is_visible}
                          onCheckedChange={async (checked) => {
                            await toggleVisibility(selectedOffersSection.id, Boolean(checked));
                          }}
                        />
                        <span className="text-xs">{selectedOffersSection.is_visible ? 'ON' : 'OFF'}</span>
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <Switch
                          checked={offersFixedModeEnabled}
                          onCheckedChange={async (checked) => {
                            await toggleOffersFixedMode(selectedOffersSection.id, Boolean(checked));
                          }}
                        />
                        <span className="text-xs">Fixed Mode</span>
                        <span className="text-xs">{offersFixedModeEnabled ? 'ON' : 'OFF'}</span>
                      </label>
                    </div>
                  )}
                </div>
                {selectedOffersSectionId && (
                  <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
                    <button
                      onClick={() => openHeadingEdit(selectedOffersSectionId)}
                      className="px-3 py-2 md:px-4 md:py-2 rounded-lg bg-blue-600 text-white text-xs md:text-sm font-semibold flex items-center justify-center gap-1.5 hover:bg-blue-700"
                    >
                      <Pencil className="w-4 h-4" />
                      <span className="hidden md:inline">Edit Heading</span>
                      <span className="md:hidden">Edit</span>
                    </button>
                    <button
                      onClick={() => handleDeleteSection(selectedOffersSectionId)}
                      className="px-3 py-2 md:px-4 md:py-2 rounded-lg bg-destructive text-destructive-foreground text-xs md:text-sm font-semibold flex items-center justify-center gap-1.5"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="hidden md:inline">Delete Section</span>
                      <span className="md:hidden">Delete</span>
                    </button>
                    <button onClick={() => setEditOffer({ heading: '', description: '', image_url: null, link: null, show_image: true, show_border: false, border_color: null, background_color: null, open_in_new_tab: false })} className="px-3 py-2 md:px-4 md:py-2 rounded-lg bg-primary text-primary-foreground text-xs md:text-sm font-semibold flex items-center justify-center gap-1.5">
                      <Plus className="w-4 h-4" />
                      <span className="hidden md:inline">Add Offer</span>
                      <span className="md:hidden">Add</span>
                    </button>
                  </div>
                )}
              </div>

              {offersFixedModeEnabled ? (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleOfferDragEnd}>
                  <SortableContext items={selectedOffers.map((offer) => offer.id)} strategy={verticalListSortingStrategy}>
                    <div className="grid gap-3">
                      {selectedOffers.map((offer) => (
                        <SortableOfferItem key={offer.id} id={offer.id} disabled={!offersFixedModeEnabled}>
                          {offer.image_url && <img src={offer.image_url} alt="" className="w-20 h-14 rounded-lg object-cover" />}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm">{offer.heading}</h3>
                            {offer.description && <p className="text-xs text-muted-foreground truncate">{offer.description}</p>}
                          </div>
                          <div className="flex items-center gap-1 bg-muted/50 px-2 py-1 rounded-lg border border-border">
                            <Switch
                              checked={offer.is_visible ?? true}
                              onCheckedChange={(checked) => toggleOfferVisibility(offer.id, Boolean(checked))}
                            />
                            <span className="text-[10px] font-medium text-muted-foreground uppercase">{(offer.is_visible ?? true) ? 'ON' : 'OFF'}</span>
                          </div>
                          <button onClick={() => setEditOffer(offer)} className="p-2 text-muted-foreground hover:text-foreground"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => deleteOffer(offer.id)} className="p-2 text-destructive"><Trash2 className="w-4 h-4" /></button>
                        </SortableOfferItem>
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              ) : (
                <div className="grid gap-3">
                  {selectedOffers.map((offer) => (
                    <div key={offer.id} className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border">
                      {offer.image_url && <img src={offer.image_url} alt="" className="w-20 h-14 rounded-lg object-cover" />}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm">{offer.heading}</h3>
                        {offer.description && <p className="text-xs text-muted-foreground truncate">{offer.description}</p>}
                      </div>
                      <div className="flex items-center gap-1 bg-muted/50 px-2 py-1 rounded-lg border border-border">
                        <Switch
                          checked={offer.is_visible ?? true}
                          onCheckedChange={(checked) => toggleOfferVisibility(offer.id, Boolean(checked))}
                        />
                        <span className="text-[10px] font-medium text-muted-foreground uppercase">{(offer.is_visible ?? true) ? 'ON' : 'OFF'}</span>
                      </div>
                      <button onClick={() => setEditOffer(offer)} className="p-2 text-muted-foreground hover:text-foreground"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => deleteOffer(offer.id)} className="p-2 text-destructive"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              )}
              {editOffer && (
                <Modal title={editOffer.id ? 'Edit Offer' : 'Add Offer'} onClose={() => setEditOffer(null)}>
                  <div className="space-y-4">
                    <ImageUpload label="Offer Image" value={editOffer.image_url || null} onChange={(url) => setEditOffer({ ...editOffer, image_url: url })} folder="offers" />
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Heading</label>
                      <input value={editOffer.heading || ''} onChange={(e) => setEditOffer({ ...editOffer, heading: e.target.value })} className="w-full px-4 py-2.5 rounded-lg border border-input bg-background" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Description</label>
                      <CKEditor value={editOffer.description || ''} onChange={(value) => setEditOffer({ ...editOffer, description: value })} className="min-h-[100px]" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Link (optional)</label>
                      <input value={editOffer.link || ''} onChange={(e) => setEditOffer({ ...editOffer, link: e.target.value || null })} className="w-full px-4 py-2.5 rounded-lg border border-input bg-background" />
                    </div>
                    <label className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Switch checked={editOffer.show_border ?? false} onCheckedChange={(checked) => setEditOffer({ ...editOffer, show_border: Boolean(checked) })} />
                      <span>Enable Border</span>
                    </label>
                    <label className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Switch checked={editOffer.open_in_new_tab ?? false} onCheckedChange={(checked) => setEditOffer({ ...editOffer, open_in_new_tab: Boolean(checked) })} />
                      <span>Open in new tab</span>
                    </label>
                    {editOffer.show_border && (
                      <div>
                        <label className="block text-sm font-medium mb-1.5">Border Color</label>
                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            value={editOffer.border_color || '#000000'}
                            onChange={(e) => setEditOffer({ ...editOffer, border_color: e.target.value })}
                            className="h-10 w-20 rounded cursor-pointer border-0"
                          />
                          <input
                            type="text"
                            value={editOffer.border_color || ''}
                            onChange={(e) => setEditOffer({ ...editOffer, border_color: e.target.value || null })}
                            placeholder="#000000"
                            className="flex-1 px-4 py-2.5 rounded-lg border border-input bg-background"
                          />
                        </div>
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Container Background Color</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={editOffer.background_color || '#f3f4f6'}
                          onChange={(e) => setEditOffer({ ...editOffer, background_color: e.target.value })}
                          className="h-10 w-20 rounded cursor-pointer border-0"
                        />
                        <input
                          type="text"
                          value={editOffer.background_color || ''}
                          onChange={(e) => setEditOffer({ ...editOffer, background_color: e.target.value || null })}
                          placeholder="#f3f4f6"
                          className="flex-1 px-4 py-2.5 rounded-lg border border-input bg-background"
                        />
                      </div>
                    </div>
                    <button onClick={saveOffer} className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold">Save</button>
                  </div>
                </Modal>
              )}
            </div>
          )}

          {/* 2-COL ADS */}
          {tab === 'ads_2col' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">2-Column Ads</h2>
                <button
                  onClick={() => {
                    setAddSectionType('ads_2col');
                    setShowAddSectionModal(true);
                  }}
                  className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold flex items-center gap-1.5 hover:bg-green-700"
                >
                  <Plus className="w-4 h-4" /> Add New Section
                </button>
              </div>

              {sections.filter(s => s.section_type === 'ads_2col').length > 0 && (
                <div className="mb-6 hidden md:block">
                  <div className="flex gap-2 flex-wrap mb-4 overflow-x-auto pb-2">
                    {sections.filter(s => s.section_type === 'ads_2col').map(section => (
                      <button
                        key={section.id}
                        onClick={() => setSelectedAds2SectionId(section.id)}
                        className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${selectedAds2SectionId === section.id
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-card border border-border text-foreground hover:bg-muted'
                          }`}
                      >
                        {getSectionDisplayName(section)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-4 mb-4">
                <p className="text-xs md:text-sm text-muted-foreground">
                  {selectedAds2SectionId ? `Section: ${getSectionDisplayName(sections.find(s => s.id === selectedAds2SectionId))}` : 'No section selected'}
                </p>
                {selectedAds2SectionId && (
                  <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
                    <label className="flex items-center gap-2 text-sm self-center md:self-auto">
                      <Switch
                        checked={ads2FixedModeEnabled}
                        onCheckedChange={async (checked) => {
                          await toggleAds2FixedMode(selectedAds2SectionId, Boolean(checked));
                        }}
                      />
                      <span className="text-xs">Fixed Mode</span>
                      <span className="text-xs">{ads2FixedModeEnabled ? 'ON' : 'OFF'}</span>
                    </label>
                    <button
                      onClick={() => openHeadingEdit(selectedAds2SectionId)}
                      className="px-3 py-2 md:px-4 md:py-2 rounded-lg bg-blue-600 text-white text-xs md:text-sm font-semibold flex items-center justify-center gap-1.5 hover:bg-blue-700"
                    >
                      <Pencil className="w-4 h-4" />
                      <span className="hidden md:inline">Edit Heading</span>
                      <span className="md:hidden">Edit</span>
                    </button>
                    <button
                      onClick={() => handleDeleteSection(selectedAds2SectionId)}
                      className="px-3 py-2 md:px-4 md:py-2 rounded-lg bg-destructive text-destructive-foreground text-xs md:text-sm font-semibold flex items-center justify-center gap-1.5"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="hidden md:inline">Delete Section</span>
                      <span className="md:hidden">Delete</span>
                    </button>
                    <button onClick={() => setEditAd2({ image_url: null, link: null, show_image: true, show_border: false, border_color: null })} className="px-3 py-2 md:px-4 md:py-2 rounded-lg bg-primary text-primary-foreground text-xs md:text-sm font-semibold flex items-center justify-center gap-1.5">
                      <Plus className="w-4 h-4" />
                      <span className="hidden md:inline">Add Item</span>
                      <span className="md:hidden">Add</span>
                    </button>
                  </div>
                )}
              </div>

              {ads2FixedModeEnabled ? (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleAds2DragEnd}>
                  <SortableContext items={selectedAds2.map((ad) => ad.id)} strategy={verticalListSortingStrategy}>
                    <div className="grid gap-3">
                      {selectedAds2.map((ad) => (
                        <SortableOfferItem key={ad.id} id={ad.id} disabled={!ads2FixedModeEnabled}>
                          {ad.image_url && <img src={ad.image_url} alt="" className="w-20 h-14 rounded-lg object-cover" />}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm">Ad {selectedAds2.indexOf(ad) + 1}</h3>
                          </div>
                          <div className="flex items-center gap-1 bg-muted/50 px-2 py-1 rounded-lg border border-border">
                            <Switch
                              checked={ad.is_visible ?? true}
                              onCheckedChange={(checked) => toggleAd2Visibility(ad.id, Boolean(checked))}
                            />
                            <span className="text-[10px] font-medium text-muted-foreground uppercase">{(ad.is_visible ?? true) ? 'ON' : 'OFF'}</span>
                          </div>
                          <button onClick={() => setEditAd2(ad)} className="p-2 text-muted-foreground hover:text-foreground"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => deleteAd2(ad.id)} className="p-2 text-destructive"><Trash2 className="w-4 h-4" /></button>
                        </SortableOfferItem>
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {ads2
                    .filter(a => selectedAds2SectionId ? a.section_id === selectedAds2SectionId : true)
                    .map((ad) => (
                      <div key={ad.id} className="relative rounded-xl overflow-hidden border border-border aspect-[2/1] bg-muted group">
                        {ad.image_url && <img src={ad.image_url} alt="" className="w-full h-full object-cover" />}
                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="w-8 h-8 rounded-full bg-card shadow flex items-center justify-center">
                            <Switch
                              checked={ad.is_visible ?? true}
                              onCheckedChange={(checked) => toggleAd2Visibility(ad.id, Boolean(checked))}
                            />
                          </div>
                          <button onClick={() => setEditAd2(ad)} className="w-8 h-8 rounded-full bg-card shadow flex items-center justify-center"><Pencil className="w-3.5 h-3.5" /></button>
                          <button onClick={() => deleteAd2(ad.id)} className="w-8 h-8 rounded-full bg-destructive text-destructive-foreground shadow flex items-center justify-center"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
              {editAd2 && (
                <Modal title={editAd2.id ? 'Edit 2-Col Ad' : 'Add 2-Col Ad'} onClose={() => setEditAd2(null)}>
                  <div className="space-y-4">
                    <ImageUpload label="Ad Image" value={editAd2.image_url || null} onChange={(url) => setEditAd2({ ...editAd2, image_url: url })} folder="ads" />
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Link (optional)</label>
                      <input value={editAd2.link || ''} onChange={(e) => setEditAd2({ ...editAd2, link: e.target.value || null })} className="w-full px-4 py-2.5 rounded-lg border border-input bg-background" />
                    </div>
                    <label className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Switch checked={editAd2.show_border ?? false} onCheckedChange={(checked) => setEditAd2({ ...editAd2, show_border: Boolean(checked) })} />
                      <span>Enable Border</span>
                    </label>
                    {editAd2.show_border && (
                      <div>
                        <label className="block text-sm font-medium mb-1.5">Border Color</label>
                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            value={editAd2.border_color || '#000000'}
                            onChange={(e) => setEditAd2({ ...editAd2, border_color: e.target.value })}
                            className="h-10 w-20 rounded cursor-pointer border-0"
                          />
                          <input
                            type="text"
                            value={editAd2.border_color || ''}
                            onChange={(e) => setEditAd2({ ...editAd2, border_color: e.target.value || null })}
                            placeholder="#000000"
                            className="flex-1 px-4 py-2.5 rounded-lg border border-input bg-background"
                          />
                        </div>
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Container Background Color</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={editAd2.background_color || '#f3f4f6'}
                          onChange={(e) => setEditAd2({ ...editAd2, background_color: e.target.value })}
                          className="h-10 w-20 rounded cursor-pointer border-0"
                        />
                        <input
                          type="text"
                          value={editAd2.background_color || ''}
                          onChange={(e) => setEditAd2({ ...editAd2, background_color: e.target.value || null })}
                          placeholder="#f3f4f6"
                          className="flex-1 px-4 py-2.5 rounded-lg border border-input bg-background"
                        />
                      </div>
                    </div>
                    <button onClick={saveAd2} className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold">Save</button>
                  </div>
                </Modal>
              )}
            </div>
          )}

          {/* 1-COL ADS */}
          {tab === 'ads_1col' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">1-Column Ad</h2>
                <button
                  onClick={() => {
                    setAddSectionType('ads_1col');
                    setShowAddSectionModal(true);
                  }}
                  className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold flex items-center gap-1.5 hover:bg-green-700"
                >
                  <Plus className="w-4 h-4" /> Add New Section
                </button>
              </div>

              {sections.filter(s => s.section_type === 'ads_1col').length > 0 && (
                <div className="mb-6 hidden md:block">
                  <div className="flex gap-2 flex-wrap mb-4 overflow-x-auto pb-2">
                    {sections.filter(s => s.section_type === 'ads_1col').map(section => (
                      <button
                        key={section.id}
                        onClick={() => setSelectedAds1SectionId(section.id)}
                        className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${selectedAds1SectionId === section.id
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-card border border-border text-foreground hover:bg-muted'
                          }`}
                      >
                        {getSectionDisplayName(section)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-4 mb-4">
                <p className="text-xs md:text-sm text-muted-foreground">
                  {selectedAds1SectionId ? `Section: ${getSectionDisplayName(sections.find(s => s.id === selectedAds1SectionId))}` : 'No section selected'}
                </p>
                {selectedAds1SectionId && (
                  <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
                    <label className="flex items-center gap-2 text-sm self-center md:self-auto">
                      <Switch
                        checked={ads1FixedModeEnabled}
                        onCheckedChange={async (checked) => {
                          await toggleAds2FixedMode(selectedAds1SectionId, Boolean(checked));
                        }}
                      />
                      <span className="text-xs">Fixed Mode</span>
                      <span className="text-xs">{ads1FixedModeEnabled ? 'ON' : 'OFF'}</span>
                    </label>
                    <button
                      onClick={() => openHeadingEdit(selectedAds1SectionId)}
                      className="px-3 py-2 md:px-4 md:py-2 rounded-lg bg-blue-600 text-white text-xs md:text-sm font-semibold flex items-center justify-center gap-1.5 hover:bg-blue-700"
                    >
                      <Pencil className="w-4 h-4" />
                      <span className="hidden md:inline">Edit Heading</span>
                      <span className="md:hidden">Edit</span>
                    </button>
                    <button
                      onClick={() => handleDeleteSection(selectedAds1SectionId)}
                      className="px-3 py-2 md:px-4 md:py-2 rounded-lg bg-destructive text-destructive-foreground text-xs md:text-sm font-semibold flex items-center justify-center gap-1.5"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="hidden md:inline">Delete Section</span>
                      <span className="md:hidden">Delete</span>
                    </button>
                    <button onClick={() => setEditAd1({ image_url: null, link: null, show_image: true, show_border: false, border_color: null, background_color: null })} className="px-3 py-2 md:px-4 md:py-2 rounded-lg bg-primary text-primary-foreground text-xs md:text-sm font-semibold flex items-center justify-center gap-1.5">
                      <Plus className="w-4 h-4" />
                      <span className="hidden md:inline">Add Item</span>
                      <span className="md:hidden">Add</span>
                    </button>
                  </div>
                )}
              </div>

              {ads1FixedModeEnabled ? (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleAds1DragEnd}>
                  <SortableContext items={selectedAds1.map((ad) => ad.id)} strategy={verticalListSortingStrategy}>
                    <div className="grid gap-3">
                      {selectedAds1.map((ad) => (
                        <SortableOfferItem key={ad.id} id={ad.id} disabled={!ads1FixedModeEnabled}>
                          {ad.image_url && <img src={ad.image_url} alt="" className="w-20 h-14 rounded-lg object-cover" />}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm">Ad {selectedAds1.indexOf(ad) + 1}</h3>
                          </div>
                          <div className="flex items-center gap-1 bg-muted/50 px-2 py-1 rounded-lg border border-border">
                            <Switch
                              checked={ad.is_visible ?? true}
                              onCheckedChange={(checked) => toggleAd2Visibility(ad.id, Boolean(checked))}
                            />
                            <span className="text-[10px] font-medium text-muted-foreground uppercase">{(ad.is_visible ?? true) ? 'ON' : 'OFF'}</span>
                          </div>
                          <button onClick={() => setEditAd1(ad)} className="p-2 text-muted-foreground hover:text-foreground"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => deleteAd2(ad.id)} className="p-2 text-destructive"><Trash2 className="w-4 h-4" /></button>
                        </SortableOfferItem>
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              ) : (
                <div className="grid gap-3">
                  {selectedAds1.map((ad) => (
                    <div key={ad.id} className="relative rounded-xl overflow-hidden border border-border bg-muted group">
                      <div className="w-full h-[180px] sm:h-[220px] md:h-[260px]">
                        {ad.image_url && <img src={ad.image_url} alt="" className="w-full h-full object-contain bg-white" />}
                      </div>
                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-8 h-8 rounded-full bg-card shadow flex items-center justify-center">
                          <Switch
                            checked={ad.is_visible ?? true}
                            onCheckedChange={(checked) => toggleAd2Visibility(ad.id, Boolean(checked))}
                          />
                        </div>
                        <button onClick={() => setEditAd1(ad)} className="w-8 h-8 rounded-full bg-card shadow flex items-center justify-center"><Pencil className="w-3.5 h-3.5" /></button>
                        <button onClick={() => deleteAd2(ad.id)} className="w-8 h-8 rounded-full bg-destructive text-destructive-foreground shadow flex items-center justify-center"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {editAd1 && (
                <Modal title={editAd1.id ? 'Edit 1-Col Ad' : 'Add 1-Col Ad'} onClose={() => setEditAd1(null)}>
                  <div className="space-y-4">
                    <ImageUpload label="Ad Image" value={editAd1.image_url || null} onChange={(url) => setEditAd1({ ...editAd1, image_url: url })} folder="ads" />
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Link (optional)</label>
                      <input value={editAd1.link || ''} onChange={(e) => setEditAd1({ ...editAd1, link: e.target.value || null })} className="w-full px-4 py-2.5 rounded-lg border border-input bg-background" />
                    </div>
                    <label className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Switch checked={editAd1.show_border ?? false} onCheckedChange={(checked) => setEditAd1({ ...editAd1, show_border: Boolean(checked) })} />
                      <span>Enable Border</span>
                    </label>
                    {editAd1.show_border && (
                      <div>
                        <label className="block text-sm font-medium mb-1.5">Border Color</label>
                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            value={editAd1.border_color || '#000000'}
                            onChange={(e) => setEditAd1({ ...editAd1, border_color: e.target.value })}
                            className="h-10 w-20 rounded cursor-pointer border-0"
                          />
                          <input
                            type="text"
                            value={editAd1.border_color || ''}
                            onChange={(e) => setEditAd1({ ...editAd1, border_color: e.target.value || null })}
                            placeholder="#000000"
                            className="flex-1 px-4 py-2.5 rounded-lg border border-input bg-background"
                          />
                        </div>
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Container Background Color</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={editAd1.background_color || '#f3f4f6'}
                          onChange={(e) => setEditAd1({ ...editAd1, background_color: e.target.value })}
                          className="h-10 w-20 rounded cursor-pointer border-0"
                        />
                        <input
                          type="text"
                          value={editAd1.background_color || ''}
                          onChange={(e) => setEditAd1({ ...editAd1, background_color: e.target.value || null })}
                          placeholder="#f3f4f6"
                          className="flex-1 px-4 py-2.5 rounded-lg border border-input bg-background"
                        />
                      </div>
                    </div>
                    <button onClick={saveAd1} className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold">Save</button>
                  </div>
                </Modal>
              )}
            </div>
          )}

          {/* 3-COL ADS */}
          {tab === 'ads_3col' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">3-Column Ads</h2>
                <button
                  onClick={() => {
                    setAddSectionType('ads_3col');
                    setShowAddSectionModal(true);
                  }}
                  className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold flex items-center gap-1.5 hover:bg-green-700"
                >
                  <Plus className="w-4 h-4" /> Add New Section
                </button>
              </div>

              {sections.filter(s => s.section_type === 'ads_3col').length > 0 && (
                <div className="mb-6 hidden md:block">
                  <div className="flex gap-2 flex-wrap mb-4 overflow-x-auto pb-2">
                    {sections.filter(s => s.section_type === 'ads_3col').map(section => (
                      <button
                        key={section.id}
                        onClick={() => setSelectedAds3SectionId(section.id)}
                        className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${selectedAds3SectionId === section.id
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-card border border-border text-foreground hover:bg-muted'
                          }`}
                      >
                        {getSectionDisplayName(section)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-4 mb-4">
                <p className="text-xs md:text-sm text-muted-foreground">
                  {selectedAds3Section ? `Section: ${getSectionDisplayName(selectedAds3Section)}` : 'No section selected'}
                </p>
                {selectedAds3Section && (
                  <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
                    <label className="flex items-center gap-2 text-sm self-center md:self-auto">
                      <Switch
                        checked={ads3FixedModeEnabled}
                        onCheckedChange={async (checked) => {
                          await toggleAds3FixedMode(selectedAds3Section.id, Boolean(checked));
                        }}
                      />
                      <span className="text-xs">Fixed Mode</span>
                      <span className="text-xs">{ads3FixedModeEnabled ? 'ON' : 'OFF'}</span>
                    </label>
                    <button
                      onClick={() => openHeadingEdit(selectedAds3Section.id)}
                      className="px-3 py-2 md:px-4 md:py-2 rounded-lg bg-blue-600 text-white text-xs md:text-sm font-semibold flex items-center justify-center gap-1.5 hover:bg-blue-700"
                    >
                      <Pencil className="w-4 h-4" />
                      <span className="hidden md:inline">Edit Heading</span>
                      <span className="md:hidden">Edit</span>
                    </button>
                    <button
                      onClick={() => handleDeleteSection(selectedAds3Section.id)}
                      className="px-3 py-2 md:px-4 md:py-2 rounded-lg bg-destructive text-destructive-foreground text-xs md:text-sm font-semibold flex items-center justify-center gap-1.5"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="hidden md:inline">Delete Section</span>
                      <span className="md:hidden">Delete</span>
                    </button>
                    <button onClick={() => setEditAd3({ image_url: null, heading: '', description: '', link: null, show_image: true, show_border: false, border_color: null, background_color: null, open_in_new_tab: false })} className="px-3 py-2 md:px-4 md:py-2 rounded-lg bg-primary text-primary-foreground text-xs md:text-sm font-semibold flex items-center justify-center gap-1.5">
                      <Plus className="w-4 h-4" />
                      <span className="hidden md:inline">Add Item</span>
                      <span className="md:hidden">Add</span>
                    </button>
                  </div>
                )}
              </div>

              {ads3FixedModeEnabled ? (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleAds3DragEnd}>
                  <SortableContext items={selectedAds3.map((ad) => ad.id)} strategy={verticalListSortingStrategy}>
                    <div className="grid gap-3">
                      {selectedAds3.map((ad) => (
                        <SortableOfferItem key={ad.id} id={ad.id} disabled={!ads3FixedModeEnabled}>
                          {ad.image_url && <img src={ad.image_url} alt="" className="w-20 h-14 rounded-lg object-cover" />}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm">{ad.heading?.trim() || `Ad ${selectedAds3.indexOf(ad) + 1}`}</h3>
                            {ad.description && <p className="text-xs text-muted-foreground truncate">{ad.description}</p>}
                          </div>
                          <div className="flex items-center gap-1 bg-muted/50 px-2 py-1 rounded-lg border border-border">
                            <Switch
                              checked={ad.is_visible ?? true}
                              onCheckedChange={(checked) => toggleAd3Visibility(ad.id, Boolean(checked))}
                            />
                            <span className="text-[10px] font-medium text-muted-foreground uppercase">{(ad.is_visible ?? true) ? 'ON' : 'OFF'}</span>
                          </div>
                          <button onClick={() => setEditAd3(ad)} className="p-2 text-muted-foreground hover:text-foreground"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => deleteAd3(ad.id)} className="p-2 text-destructive"><Trash2 className="w-4 h-4" /></button>
                        </SortableOfferItem>
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {ads3
                    .filter(a => selectedAds3SectionId ? a.section_id === selectedAds3SectionId : true)
                    .map((ad) => (
                      <div key={ad.id} className="relative rounded-xl overflow-hidden border border-border aspect-[16/9] bg-muted group">
                        {ad.image_url && <img src={ad.image_url} alt="" className="w-full h-full object-cover" />}
                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="w-8 h-8 rounded-full bg-card shadow flex items-center justify-center">
                            <Switch
                              checked={ad.is_visible ?? true}
                              onCheckedChange={(checked) => toggleAd3Visibility(ad.id, Boolean(checked))}
                            />
                          </div>
                          <button onClick={() => setEditAd3(ad)} className="w-8 h-8 rounded-full bg-card shadow flex items-center justify-center"><Pencil className="w-3.5 h-3.5" /></button>
                          <button onClick={() => deleteAd3(ad.id)} className="w-8 h-8 rounded-full bg-destructive text-destructive-foreground shadow flex items-center justify-center"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
              {editAd3 && (
                <Modal title={editAd3.id ? 'Edit 3-Col Ad' : 'Add 3-Col Ad'} onClose={() => setEditAd3(null)}>
                  <div className="space-y-4">
                    <ImageUpload label="Ad Image" value={editAd3.image_url || null} onChange={(url) => setEditAd3({ ...editAd3, image_url: url })} folder="ads" />
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Heading (optional)</label>
                      <input value={editAd3.heading || ''} onChange={(e) => setEditAd3({ ...editAd3, heading: e.target.value || null })} className="w-full px-4 py-2.5 rounded-lg border border-input bg-background" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Description (optional)</label>
                      <CKEditor value={editAd3.description || ''} onChange={(value) => setEditAd3({ ...editAd3, description: value || null })} className="min-h-[100px]" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Link (optional)</label>
                      <input value={editAd3.link || ''} onChange={(e) => setEditAd3({ ...editAd3, link: e.target.value || null })} className="w-full px-4 py-2.5 rounded-lg border border-input bg-background" />
                    </div>
                    <label className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Switch checked={editAd3.show_border ?? false} onCheckedChange={(checked) => setEditAd3({ ...editAd3, show_border: Boolean(checked) })} />
                      <span>Enable Border</span>
                    </label>
                    <label className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Switch checked={editAd3.open_in_new_tab ?? false} onCheckedChange={(checked) => setEditAd3({ ...editAd3, open_in_new_tab: Boolean(checked) })} />
                      <span>Open in new tab</span>
                    </label>
                    {editAd3.show_border && (
                      <div>
                        <label className="block text-sm font-medium mb-1.5">Border Color</label>
                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            value={editAd3.border_color || '#000000'}
                            onChange={(e) => setEditAd3({ ...editAd3, border_color: e.target.value })}
                            className="h-10 w-20 rounded cursor-pointer border-0"
                          />
                          <input
                            type="text"
                            value={editAd3.border_color || ''}
                            onChange={(e) => setEditAd3({ ...editAd3, border_color: e.target.value || null })}
                            placeholder="#000000"
                            className="flex-1 px-4 py-2.5 rounded-lg border border-input bg-background"
                          />
                        </div>
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Container Background Color</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={editAd3.background_color || '#f3f4f6'}
                          onChange={(e) => setEditAd3({ ...editAd3, background_color: e.target.value })}
                          className="h-10 w-20 rounded cursor-pointer border-0"
                        />
                        <input
                          type="text"
                          value={editAd3.background_color || ''}
                          onChange={(e) => setEditAd3({ ...editAd3, background_color: e.target.value || null })}
                          placeholder="#f3f4f6"
                          className="flex-1 px-4 py-2.5 rounded-lg border border-input bg-background"
                        />
                      </div>
                    </div>
                    <button onClick={saveAd3} className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold">Save</button>
                  </div>
                </Modal>
              )}
            </div>
          )}

          {/* FAQS */}
          {tab === 'faqs' && (
            <div className="mx-auto flex w-full max-w-5xl flex-col px-3 md:px-6 space-y-6">
              {!showAddFaqModal && !editFaq ? (
                <>
                  <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-1.5">Page Heading</label>
                        <input
                          value={footerSettings.faq_heading ?? 'Frequently Asked Questions'}
                          onChange={(e) => setFooterSettings({ ...footerSettings, faq_heading: e.target.value })}
                          placeholder="Enter page heading..."
                          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-lg font-semibold"
                        />
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <label className="text-sm font-medium">Visible on Footer</label>
                          <Switch
                            checked={footerSettings.faq_visible ?? true}
                            onCheckedChange={(v) => setFooterSettings({ ...footerSettings, faq_visible: v })}
                          />
                        </div>
                        <button
                          onClick={handleSaveFooter}
                          disabled={isSavingFooter}
                          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold flex items-center gap-2 hover:bg-primary/90 disabled:opacity-50"
                        >
                          <Save className="w-4 h-4" />
                          {isSavingFooter ? 'Saving...' : 'Save'}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-bold">FAQs</h2>
                      <button
                        onClick={() => startNewFaq()}
                        className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold flex items-center gap-1.5 hover:bg-green-700"
                      >
                        <Plus className="w-4 h-4" /> Add FAQ
                      </button>
                    </div>

                    {faqTree.length === 0 ? (
                      <div className="text-center py-12 bg-card rounded-xl border border-border">
                        <p className="text-muted-foreground">No FAQs yet. Add your first one!</p>
                      </div>
                    ) : (
                      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={async (event) => {
                        const { active, over } = event;
                        if (!over) return;
                        const topLevelFaqs = faqTree.filter((faq) => faq.parent_id == null);
                        const oldIndex = topLevelFaqs.findIndex((faq) => faq.id === active.id);
                        const newIndex = topLevelFaqs.findIndex((faq) => faq.id === over.id);
                        if (oldIndex === -1 || newIndex === -1) return;

                        const newOrder = arrayMove(topLevelFaqs, oldIndex, newIndex).map((faq, index) => ({ ...faq, sort_order: index }));
                        const updatedFaqs = faqs.map((item) => {
                          const updated = newOrder.find((entry) => entry.id === item.id);
                          return updated ? { ...item, sort_order: updated.sort_order } : item;
                        });
                        setFaqs(updatedFaqs);

                        for (const faq of newOrder) {
                          await updateFaqSortOrder(faq.id, faq.sort_order);
                        }

                        toast.success('FAQ order saved!');
                      }}>
                        <SortableContext items={faqTree.map((faq) => faq.id)} strategy={verticalListSortingStrategy}>
                          <div className="space-y-4">
                            {faqTree.map((faq, index) => (
                              <div key={faq.id} className="rounded-xl border border-border bg-card overflow-hidden">
                                <SortableAdminItem
                                  id={faq.id}
                                  className="rounded-none border-0 border-b border-border bg-transparent p-4 last:border-b-0"
                                >
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2 mb-1">
                                      <h3 className="font-semibold text-sm md:text-base truncate">{stripHtml(faq.question)}</h3>
                                      <div className="flex items-center gap-1">
                                        <Switch
                                          checked={faq.is_visible}
                                          onCheckedChange={async (checked) => {
                                            await supabase.from('faqs').update({ is_visible: checked }).eq('id', faq.id);
                                            setFaqs((prev) => prev.map((f) => f.id === faq.id ? { ...f, is_visible: checked } : f));
                                            toast.success('FAQ visibility updated!');
                                          }}
                                        />
                                      </div>
                                    </div>
                                    <p className="text-xs md:text-sm text-muted-foreground">
                                      {faq.children.length > 0 ? `${faq.children.length} sub FAQ${faq.children.length > 1 ? 's' : ''}` : 'No sub FAQs yet'}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <button onClick={() => startEditFaq(faq as FAQ)} className="p-2 text-muted-foreground hover:text-foreground"><Pencil className="w-4 h-4" /></button>
                                    <button onClick={() => deleteFaq(faq.id)} className="p-2 text-destructive"><Trash2 className="w-4 h-4" /></button>
                                  </div>
                                </SortableAdminItem>
                                <div className="space-y-3 bg-background/40 px-4 py-4">
                                  <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-semibold">Sub FAQs</h4>
                                    <button onClick={() => startNewFaq(faq.id)} className="text-sm font-medium text-primary hover:underline">+ Add Sub FAQ</button>
                                  </div>
                                  {faq.children.length === 0 ? (
                                    <p className="text-xs md:text-sm text-muted-foreground">No sub FAQs yet.</p>
                                  ) : (
                                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={async (event) => {
                                      const { active, over } = event;
                                      if (!over) return;
                                      const children = faq.children;
                                      const oldIndex = children.findIndex((c) => c.id === active.id);
                                      const newIndex = children.findIndex((c) => c.id === over.id);
                                      if (oldIndex === -1 || newIndex === -1) return;

                                      const newOrder = arrayMove(children, oldIndex, newIndex).map((c, idx) => ({ ...c, sort_order: idx }));

                                      // Update global faqs state with new child orders
                                      setFaqs((prev) => prev.map((item) => {
                                        const updated = newOrder.find((n) => n.id === item.id);
                                        return updated ? { ...item, sort_order: updated.sort_order } : item;
                                      }));

                                      // Persist changes
                                      for (const c of newOrder) {
                                        await updateFaqSortOrder(c.id, c.sort_order);
                                      }
                                    }}>
                                      <SortableContext items={faq.children.map((c) => c.id)} strategy={verticalListSortingStrategy}>
                                        <div className="space-y-3">
                                          {faq.children.map((child) => (
                                            <SortableAdminItem id={child.id} key={child.id} className="rounded-lg border border-border bg-background p-3">
                                              <div className="min-w-0">
                                                <p className="font-medium text-sm truncate">{stripHtml(child.question)}</p>
                                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{stripHtml(child.answer)}</p>
                                              </div>
                                              <div className="flex items-center gap-1">
                                                <Switch
                                                  checked={child.is_visible}
                                                  onCheckedChange={async (checked) => {
                                                    await supabase.from('faqs').update({ is_visible: checked }).eq('id', child.id);
                                                    setFaqs((prev) => prev.map((item) => item.id === child.id ? { ...item, is_visible: checked } : item));
                                                    toast.success('Sub FAQ visibility updated!');
                                                  }}
                                                />
                                                <button onClick={() => startEditFaq(child as FAQ)} className="p-2 text-muted-foreground hover:text-foreground"><Pencil className="w-4 h-4" /></button>
                                                <button onClick={() => deleteFaq(child.id)} className="p-2 text-destructive"><Trash2 className="w-4 h-4" /></button>
                                              </div>
                                            </SortableAdminItem>
                                          ))}
                                        </div>
                                      </SortableContext>
                                    </DndContext>
                                  )}
                                </div>
                                {index < faqTree.length - 1 && <div className="border-t border-border" />}
                              </div>
                            ))}
                          </div>
                        </SortableContext>
                      </DndContext>
                    )}
                  </div>
                </>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => {
                        setEditFaq(null);
                        setShowAddFaqModal(false);
                      }}
                      className="px-4 py-2 rounded-lg bg-muted text-muted-foreground text-sm font-semibold flex items-center gap-2 hover:bg-muted/80"
                    >
                      ← Back to FAQs
                    </button>
                  </div>

                  <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                    <h2 className="text-2xl font-bold mb-6">{editFaq?.id ? (editFaq.parent_id ? 'Edit Sub FAQ' : 'Edit FAQ') : (editFaq?.parent_id ? 'Add Sub FAQ' : 'Add FAQ')}</h2>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-1.5">Question</label>
                        <CKEditor
                          value={editFaq?.question || ''}
                          onChange={(value) => setEditFaq({ ...editFaq!, question: value })}
                          placeholder="Enter question..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1.5">Answer</label>
                        <CKEditor
                          value={editFaq?.answer || ''}
                          onChange={(value) => setEditFaq({ ...editFaq!, answer: value })}
                          placeholder={editFaq?.parent_id ? 'Enter answer for this sub FAQ...' : 'Enter answer...'}
                        />
                      </div>
                      <button onClick={saveFaq} className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold w-full">
                        Save
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ADVERTISE PAGE */}
          {tab === 'advertise' && (
            <div className="mx-auto flex w-full max-w-5xl flex-col px-3 md:px-6 space-y-6">
              {/* Footer Visibility Toggle */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-base">Show "Advertise" in Footer</h3>

                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={footerSettings.advertise_visible ?? true}
                      onCheckedChange={(v) => setFooterSettings({ ...footerSettings, advertise_visible: v })}
                    />
                    <span className="text-sm text-muted-foreground">{(footerSettings.advertise_visible ?? true) ? 'Visible' : 'Hidden'}</span>
                  </div>
                </div>
              </div>
              {/* Hero Section */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-semibold text-xl">Hero Section</h3>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={advertiseSettings.hero_visible}
                      onCheckedChange={(v) => setAdvertiseSettings({ ...advertiseSettings, hero_visible: v })}
                    />
                    <span className="text-sm text-muted-foreground">Visible</span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Small Heading</label>
                    <input
                      type="text"
                      value={advertiseSettings.hero_small_heading}
                      onChange={(e) => setAdvertiseSettings({ ...advertiseSettings, hero_small_heading: e.target.value })}
                      placeholder="Enter small heading..."
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Main Heading</label>
                    <input
                      type="text"
                      value={advertiseSettings.hero_main_heading}
                      onChange={(e) => setAdvertiseSettings({ ...advertiseSettings, hero_main_heading: e.target.value })}
                      placeholder="Enter main heading..."
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Description</label>
                    <CKEditor
                      value={advertiseSettings.hero_description}
                      onChange={(value) => setAdvertiseSettings({ ...advertiseSettings, hero_description: value })}
                      placeholder="Enter description..."
                      className="min-h-[100px]"
                    />
                  </div>

                  {/* Hero Button */}
                  <div className="space-y-4 pt-2">
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={advertiseSettings.hero_button_visible}
                        onCheckedChange={(v) => setAdvertiseSettings({ ...advertiseSettings, hero_button_visible: v })}
                      />
                      <span className="text-sm text-muted-foreground">Show Hero Button</span>
                    </div>
                    {advertiseSettings.hero_button_visible && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1.5">Button Label</label>
                          <input
                            type="text"
                            value={advertiseSettings.hero_button_text || ''}
                            onChange={(e) => setAdvertiseSettings({ ...advertiseSettings, hero_button_text: e.target.value })}
                            placeholder="Enter button label..."
                            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1.5">Button Link</label>
                          <input
                            type="text"
                            value={advertiseSettings.hero_button_link || ''}
                            onChange={(e) => setAdvertiseSettings({ ...advertiseSettings, hero_button_link: e.target.value })}
                            placeholder="Enter button link..."
                            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <Switch
                      checked={advertiseSettings.hero_image_visible}
                      onCheckedChange={(v) => setAdvertiseSettings({ ...advertiseSettings, hero_image_visible: v })}
                    />
                    <span className="text-sm text-muted-foreground">Show Image</span>
                  </div>
                  {advertiseSettings.hero_image_visible && (
                    <ImageUpload
                      label="Hero Image"
                      value={advertiseSettings.hero_image_url || null}
                      onChange={(url) => setAdvertiseSettings({ ...advertiseSettings, hero_image_url: url || '' })}
                      folder="advertise"
                    />
                  )}
                </div>
              </div>

              {/* Marketing Strategy Cards */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-semibold text-xl">Marketing Strategy Cards</h3>
                  <button
                    onClick={() => {
                      setEditAdvertiseCard({ heading: '', description: '' });
                      setShowAddAdvertiseCardModal(true);
                    }}
                    className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold flex items-center gap-1.5 hover:bg-green-700"
                  >
                    <Plus className="w-4 h-4" /> Add Card
                  </button>
                </div>
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Section Main Heading</label>
                    <input
                      type="text"
                      value={advertiseSettings.marketing_cards_main_heading}
                      onChange={(e) => setAdvertiseSettings({ ...advertiseSettings, marketing_cards_main_heading: e.target.value })}
                      placeholder="Enter section main heading..."
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Section Subheading</label>
                    <input
                      type="text"
                      value={advertiseSettings.marketing_cards_subheading}
                      onChange={(e) => setAdvertiseSettings({ ...advertiseSettings, marketing_cards_subheading: e.target.value })}
                      placeholder="Enter section subheading..."
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    />
                  </div>
                </div>
                {advertiseCards.length === 0 ? (
                  <div className="text-center py-12 bg-card rounded-xl border border-border">
                    <p className="text-muted-foreground">No cards yet. Add your first one!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {advertiseCards.map((card) => (
                      <div key={card.id} className="p-4 border border-border rounded-xl bg-background">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={card.is_visible}
                              onCheckedChange={async (v) => {
                                await supabase.from('advertise_cards').update({ is_visible: v }).eq('id', card.id);
                                loadAll();
                              }}
                            />
                            <span className="text-xs text-muted-foreground">{card.is_visible ? 'Visible' : 'Hidden'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                setEditAdvertiseCard(card);
                                setShowAddAdvertiseCardModal(true);
                              }}
                              className="p-1 hover:bg-muted rounded"
                            >
                              <Pencil className="w-4 h-4 text-muted-foreground" />
                            </button>
                            <button
                              onClick={() => handleDeleteAdvertiseCard(card.id)}
                              className="p-1 hover:bg-muted rounded"
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </button>
                          </div>
                        </div>
                        <h4 className="font-semibold text-base mb-2">{card.heading}</h4>
                        <p className="text-sm text-muted-foreground line-clamp-2">{card.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>





              {/* Dynamic Sections Heading */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <h3 className="font-semibold text-xl mb-6">Dynamic Sections Heading</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Heading Part 1 (Normal weight)</label>
                    <input
                      type="text"
                      value={advertiseSettings.dynamic_sections_heading_part1}
                      onChange={(e) => setAdvertiseSettings({ ...advertiseSettings, dynamic_sections_heading_part1: e.target.value })}
                      placeholder="Enter heading part 1..."
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Heading Part 2 (Medium weight)</label>
                    <input
                      type="text"
                      value={advertiseSettings.dynamic_sections_heading_part2}
                      onChange={(e) => setAdvertiseSettings({ ...advertiseSettings, dynamic_sections_heading_part2: e.target.value })}
                      placeholder="Enter heading part 2..."
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Dynamic Advertise Sections */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-xl">Dynamic Advertise Sections</h3>
                  <button
                    onClick={() => {
                      setEditAdvertiseSection({ small_heading: '', main_heading: '', description: '', button_visible: true });
                      setShowAddAdvertiseSectionModal(true);
                    }}
                    className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold flex items-center gap-1.5 hover:bg-green-700"
                  >
                    <Plus className="w-4 h-4" /> Add Section
                  </button>
                </div>
                {advertiseSections.length === 0 ? (
                  <div className="text-center py-12 bg-card rounded-xl border border-border">
                    <p className="text-muted-foreground">No dynamic sections yet. Add your first one!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {advertiseSections.map((section, index) => {
                      const isLeftImage = index % 2 === 0;
                      return (
                        <div key={section.id} className="p-4 border border-border rounded-xl bg-background">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={section.is_visible}
                                onCheckedChange={async (v) => {
                                  await supabase.from('advertise_sections').update({ is_visible: v }).eq('id', section.id);
                                  loadAll();
                                }}
                              />
                              <span className="text-xs text-muted-foreground">{section.is_visible ? 'Visible' : 'Hidden'}</span>
                              <span className="text-xs text-muted-foreground">({isLeftImage ? 'Image Left' : 'Image Right'})</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => {
                                  setEditAdvertiseSection(section);
                                  setShowAddAdvertiseSectionModal(true);
                                }}
                                className="p-1 hover:bg-muted rounded"
                              >
                                <Pencil className="w-4 h-4 text-muted-foreground" />
                              </button>
                              <button
                                onClick={() => handleDeleteAdvertiseSection(section.id)}
                                className="p-1 hover:bg-muted rounded"
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </button>
                            </div>
                          </div>
                          <h4 className="font-semibold text-base mb-2">{section.main_heading}</h4>
                          {section.small_heading && (
                            <p className="text-sm text-primary mb-1">{section.small_heading}</p>
                          )}
                          <p className="text-sm text-muted-foreground line-clamp-3">{section.description}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Save Button */}
              <button
                onClick={handleSaveAdvertiseSettings}
                className="w-full px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold text-lg hover:bg-primary/90"
              >
                Save Advertise Settings
              </button>

              {/* Advertise Card Modal */}
              {showAddAdvertiseCardModal && (
                <Modal
                  title={editAdvertiseCard?.id ? 'Edit Card' : 'Add Card'}
                  onClose={() => {
                    setShowAddAdvertiseCardModal(false);
                    setEditAdvertiseCard(null);
                  }}
                >
                  <div className="space-y-4">
                    <ImageUpload
                      label="Logo/Icon"
                      value={editAdvertiseCard?.logo_url || null}
                      onChange={(url) => setEditAdvertiseCard(prev => prev ? { ...prev, logo_url: url } : null)}
                      folder="advertise"
                    />
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Heading</label>
                      <input
                        type="text"
                        value={editAdvertiseCard?.heading || ''}
                        onChange={(e) => setEditAdvertiseCard(prev => prev ? { ...prev, heading: e.target.value } : null)}
                        placeholder="Enter card heading..."
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Description</label>
                      <CKEditor
                        value={editAdvertiseCard?.description || ''}
                        onChange={(value) => setEditAdvertiseCard(prev => prev ? { ...prev, description: value } : null)}
                        placeholder="Enter card description..."
                        className="min-h-[100px]"
                      />
                    </div>
                    <button
                      onClick={handleSaveAdvertiseCard}
                      className="w-full px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold"
                    >
                      Save Card
                    </button>
                  </div>
                </Modal>
              )}

              {/* Advertise Section Modal */}
              {showAddAdvertiseSectionModal && (
                <Modal
                  title={editAdvertiseSection?.id ? 'Edit Section' : 'Add Section'}
                  onClose={() => {
                    setShowAddAdvertiseSectionModal(false);
                    setEditAdvertiseSection(null);
                  }}
                >
                  <div className="space-y-4">

                    <div>
                      <label className="block text-sm font-medium mb-1.5">Main Heading</label>
                      <input
                        type="text"
                        value={editAdvertiseSection?.main_heading || ''}
                        onChange={(e) => setEditAdvertiseSection(prev => prev ? { ...prev, main_heading: e.target.value } : null)}
                        placeholder="Enter main heading..."
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Description</label>
                      <CKEditor
                        value={editAdvertiseSection?.description || ''}
                        onChange={(value) => setEditAdvertiseSection(prev => prev ? { ...prev, description: value } : null)}
                        placeholder="Enter section description..."
                        className="min-h-[100px]"
                      />
                    </div>

                    {/* Button Fields */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={editAdvertiseSection?.button_visible ?? true}
                          onCheckedChange={(v) => setEditAdvertiseSection(prev => prev ? { ...prev, button_visible: v } : null)}
                        />
                        <span className="text-sm text-muted-foreground">Show Button</span>
                      </div>
                      {editAdvertiseSection?.button_visible !== false && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-1.5">Button Label</label>
                            <input
                              type="text"
                              value={editAdvertiseSection?.button_text || ''}
                              onChange={(e) => setEditAdvertiseSection(prev => prev ? { ...prev, button_text: e.target.value } : null)}
                              placeholder="Enter button label..."
                              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1.5">Button Link</label>
                            <input
                              type="text"
                              value={editAdvertiseSection?.button_link || ''}
                              onChange={(e) => setEditAdvertiseSection(prev => prev ? { ...prev, button_link: e.target.value } : null)}
                              placeholder="Enter button link..."
                              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <ImageUpload
                      label="Image"
                      value={editAdvertiseSection?.image_url || null}
                      onChange={(url) => setEditAdvertiseSection(prev => prev ? { ...prev, image_url: url } : null)}
                      folder="advertise"
                    />
                    <button
                      onClick={handleSaveAdvertiseSection}
                      className="w-full px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold"
                    >
                      Save Section
                    </button>
                  </div>
                </Modal>
              )}
            </div>
          )}

          {/* GET LISTED TAB */}
          {tab === 'get-listed' && (
            <div className="mx-auto flex w-full max-w-5xl flex-col px-3 md:px-6 space-y-6">
              {/* Page Settings */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">

                  <button
                    onClick={handleSaveGetListedSettings}
                    className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold"
                  >
                    Save Settings
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-6">
                  {/* Footer Visibility Toggle */}
                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                    <div>
                      <label className="block text-sm font-medium">Show "Get Listed" in Footer</label>

                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={footerSettings.get_listed_visible ?? true}
                        onCheckedChange={(v) => setFooterSettings({ ...footerSettings, get_listed_visible: v })}
                      />
                      <span className="text-sm text-muted-foreground">{(footerSettings.get_listed_visible ?? true) ? 'Visible' : 'Hidden'}</span>
                    </div>
                  </div>

                  {/* Currency Toggle Visibility */}
                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                    <div>
                      <label className="block text-sm font-medium">Show Currency Toggle (INR/USD)</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={getListedSettings?.show_currency_toggle ?? true}
                        onCheckedChange={(v) => setGetListedSettings(prev => prev ? { ...prev, show_currency_toggle: v } : null)}
                      />
                      <span className="text-sm text-muted-foreground">{(getListedSettings?.show_currency_toggle ?? true) ? 'Visible' : 'Hidden'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pricing Plans */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div className="flex flex-col gap-4 mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Main Heading</label>
                      <input
                        type="text"
                        value={getListedSettings?.main_heading || 'Choose the best plan for your business.'}
                        onChange={(e) => setGetListedSettings(prev => prev ? { ...prev, main_heading: e.target.value } : null)}
                        placeholder="Enter main heading..."
                        className="w-[650px] rounded-lg border border-input bg-background px-3 py-2 text-sm"
                      />
                    </div>
                    <button
                      onClick={() => {
                        setEditGetListedPlan({
                          plan_name: '',
                          price_inr: 0,
                          duration: '',
                          button_text: '',
                          button_link: '',
                          button_visible: true,
                          popular: false,
                          visible: true,
                          show_view_more: true,
                        });
                        setShowAddGetListedPlanModal(true);
                      }}
                      className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold flex items-center gap-1.5 hover:bg-green-700"
                    >
                      <Plus className="w-4 h-4" /> Add Plan
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-muted/100 rounded-xl">
                    <div>
                      <label className="block text-sm font-medium">Show Pricing Section</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={getListedSettings?.show_pricing_section ?? true}
                        onCheckedChange={(v) => setGetListedSettings(prev => prev ? { ...prev, show_pricing_section: v } : null)}
                      />
                      <span className="text-sm text-muted-foreground">{(getListedSettings?.show_pricing_section ?? true) ? 'Visible' : 'Hidden'}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {getListedPlans.map((plan) => (
                    <div
                      key={plan.id}
                      className="rounded-xl border border-border p-4 bg-background"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-lg">{plan.plan_name}</h4>
                          {plan.popular && (
                            <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-bold">
                              Popular
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={plan.visible}
                            onCheckedChange={(v) => handleToggleGetListedPlanVisibility(plan.id, v)}
                          />
                          <span className="text-sm text-muted-foreground">{plan.visible ? 'Visible' : 'Hidden'}</span>
                          <button
                            onClick={() => {
                              setEditGetListedPlan(plan);
                              setShowAddGetListedPlanModal(true);
                            }}
                            className="p-2 rounded-lg hover:bg-accent text-muted-foreground"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Delete this plan?')) {
                                handleDeleteGetListedPlan(plan.id);
                              }
                            }}
                            className="p-2 rounded-lg hover:bg-red-100 text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <label className="block text-xs text-muted-foreground mb-1">Price (INR)</label>
                          <span className="text-lg font-bold">₹{plan.price_inr.toLocaleString()}</span>
                        </div>
                        <div>
                          <label className="block text-xs text-muted-foreground mb-1">Duration</label>
                          <span className="text-sm">{plan.duration}</span>
                        </div>
                        <div>
                          <label className="block text-xs text-muted-foreground mb-1">Button Visible</label>
                          <span className="text-sm">{plan.button_visible ? 'Yes' : 'No'}</span>
                        </div>

                      </div>

                      {/* Features */}
                      <div className="border-t pt-4">
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="font-medium text-sm">Features</h5>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              placeholder="Add new feature..."
                              id={`feature-input-${plan.id}`}
                              className="w-64 px-3 py-2 rounded-lg border border-input bg-background text-sm"
                            />
                            <button
                              onClick={() => {
                                const input = document.getElementById(`feature-input-${plan.id}`) as HTMLInputElement;
                                if (input.value.trim()) {
                                  handleAddGetListedPlanFeature(plan.id, input.value.trim());
                                  input.value = '';
                                }
                              }}
                              className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold"
                            >
                              Add
                            </button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          {getListedPlanFeatures
                            .filter(f => f.plan_id === plan.id)
                            .map((feature) => (
                              <div
                                key={feature.id}
                                className="flex items-center justify-between gap-3 p-3 rounded-lg bg-gray-50"
                              >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  {editingGetListedFeatureId === feature.id ? (
                                    <input
                                      type="text"
                                      value={editingGetListedFeatureText}
                                      onChange={(e) => setEditingGetListedFeatureText(e.target.value)}
                                      className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm"
                                    />
                                  ) : (
                                    <span className="text-sm flex items-center gap-2 truncate">
                                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                                      {feature.feature_text}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Switch
                                    checked={feature.visible ?? true}
                                    onCheckedChange={(v) => feature.id && handleToggleGetListedPlanFeatureVisibility(feature.id, v)}
                                  />
                                  {editingGetListedFeatureId === feature.id ? (
                                    <>
                                      <button
                                        onClick={() => feature.id && handleUpdateGetListedPlanFeatureText(feature.id, editingGetListedFeatureText)}
                                        className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold"
                                      >
                                        Save
                                      </button>
                                      <button
                                        onClick={() => {
                                          setEditingGetListedFeatureId(null);
                                          setEditingGetListedFeatureText('');
                                        }}
                                        className="px-3 py-1.5 rounded-lg border border-input bg-background text-sm"
                                      >
                                        Cancel
                                      </button>
                                    </>
                                  ) : (
                                    <button
                                      onClick={() => {
                                        setEditingGetListedFeatureId(feature.id || null);
                                        setEditingGetListedFeatureText(feature.feature_text || '');
                                      }}
                                      className="p-2 rounded-lg hover:bg-accent text-muted-foreground"
                                    >
                                      <Pencil className="w-4 h-4" />
                                    </button>
                                  )}
                                  <button
                                    onClick={() => feature.id && handleDeleteGetListedPlanFeature(feature.id)}
                                    className="text-red-500 hover:text-red-700"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Comparison Table */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div className="flex flex-col gap-4 mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-base font-medium mb-1.5">Comparison Heading</label>
                      <input
                        type="text"
                        value={getListedSettings?.comparison_heading || 'Detailed pricing'}
                        onChange={(e) => setGetListedSettings(prev => prev ? { ...prev, comparison_heading: e.target.value } : null)}
                        placeholder="Enter comparison heading..."
                        className="w-[650px] rounded-lg border border-input bg-background px-3 py-2 text-sm"
                      />
                    </div>
                    <button
                      onClick={() => {
                        setEditGetListedComparisonRow({
                          row_title: '',
                          visible: true,
                        });
                        setShowAddGetListedComparisonRowModal(true);
                      }}
                      className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold flex items-center gap-1.5 hover:bg-green-700"
                    >
                      <Plus className="w-4 h-4" /> Add Row
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-muted/100 rounded-xl">
                    <div>
                      <label className="block text-base font-medium">Show Comparison Table</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={getListedSettings?.show_comparison_section ?? true}
                        onCheckedChange={(v) => setGetListedSettings(prev => prev ? { ...prev, show_comparison_section: v } : null)}
                      />
                      <span className="text-sm text-muted-foreground">{(getListedSettings?.show_comparison_section ?? true) ? 'Visible' : 'Hidden'}</span>
                    </div>
                  </div>
                </div>

                {getListedPlans.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Add pricing plans first to see the comparison table
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b-2 border-border">
                          <th className="text-left py-3 px-4 font-semibold bg-gray-50 w-1/4">Feature</th>
                          {getListedPlans.map((plan) => (
                            <th key={plan.id} className="text-center py-3 px-4 font-semibold bg-gray-50">
                              {editingComparisonHeaderPlanId === plan.id ? (
                                <div className="flex items-center gap-2 justify-center">
                                  <Switch
                                    checked={getComparisonPlanVisibilityMap()[plan.id] ?? true}
                                    onCheckedChange={(v) => handleToggleComparisonPlanColumnVisibility(plan.id, v)}
                                  />
                                  <input
                                    type="text"
                                    value={editingComparisonHeaderText}
                                    onChange={(e) => setEditingComparisonHeaderText(e.target.value)}
                                    onBlur={() => handleSaveComparisonHeader(plan.id)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        handleSaveComparisonHeader(plan.id);
                                      } else if (e.key === 'Escape') {
                                        setEditingComparisonHeaderPlanId(null);
                                        setEditingComparisonHeaderText('');
                                      }
                                    }}
                                    autoFocus
                                    placeholder="Enter custom header..."
                                    className="w-full px-2 py-1 text-sm rounded border border-input bg-background"
                                  />
                                  <button
                                    onClick={() => handleSaveComparisonHeader(plan.id)}
                                    className="p-1 text-green-600 hover:bg-green-50 rounded"
                                  >
                                    <CheckCircle2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingComparisonHeaderPlanId(null);
                                      setEditingComparisonHeaderText('');
                                    }}
                                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 justify-center">
                                  <Switch
                                    checked={getComparisonPlanVisibilityMap()[plan.id] ?? true}
                                    onCheckedChange={(v) => handleToggleComparisonPlanColumnVisibility(plan.id, v)}
                                  />
                                  <span>{plan.comparison_header || plan.plan_name}</span>
                                  <button
                                    onClick={() => {
                                      setEditingComparisonHeaderPlanId(plan.id);
                                      setEditingComparisonHeaderText(plan.comparison_header || plan.plan_name);
                                    }}
                                    className="p-1 rounded hover:bg-accent text-muted-foreground"
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </button>
                                </div>
                              )}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {/* Engagement Duration (Auto) */}
                        <tr className="border-b border-border">
                          <td className="py-3 px-4 font-medium">Engagement Duration</td>
                          {getListedPlans.map((plan) => (
                            <td key={plan.id} className="py-3 px-4 text-center text-sm">
                              {plan.duration}
                            </td>
                          ))}
                        </tr>

                        {/* Custom Rows */}
                        {getListedComparisonRows
                          .filter(row => row.visible)
                          .map((row) => (
                            <tr key={row.id} className="border-b border-border">
                              <td className="py-3 px-4">
                                <div className="flex items-center justify-between">
                                  <span className="font-medium">{row.row_title}</span>
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() => {
                                        setEditGetListedComparisonRow(row);
                                        setShowAddGetListedComparisonRowModal(true);
                                      }}
                                      className="p-1 rounded hover:bg-accent text-muted-foreground"
                                    >
                                      <Pencil className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        if (confirm('Delete this row?')) {
                                          handleDeleteGetListedComparisonRow(row.id);
                                        }
                                      }}
                                      className="p-1 rounded hover:bg-red-100 text-red-600"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              </td>
                              {getListedPlans.map((plan) => {
                                const cellKey = `${row.id}-${plan.id}`;
                                const cell = getListedComparisonCells.find(
                                  c => c.row_id === row.id && c.plan_id === plan.id
                                );
                                const currentValue = cellInputValues[cellKey] ?? (cell?.custom_text || '');

                                return (
                                  <td key={plan.id} className="py-3 px-4 text-center">
                                    <div className="flex flex-col items-center gap-2">
                                      <Switch
                                        checked={cell?.tick_enabled ?? false}
                                        onCheckedChange={(v) => {
                                          // Clear any pending debounce for this cell
                                          if (debounceTimerRef.current[cellKey]) {
                                            clearTimeout(debounceTimerRef.current[cellKey]!);
                                          }
                                          handleUpdateGetListedComparisonCell(
                                            row.id,
                                            plan.id,
                                            v,
                                            currentValue
                                          );
                                        }}
                                      />
                                      {!(cell?.tick_enabled) && (
                                        <input
                                          type="text"
                                          value={currentValue}
                                          placeholder="Enter text..."
                                          onChange={(e) => {
                                            const newValue = e.target.value;
                                            setCellInputValues(prev => ({
                                              ...prev,
                                              [cellKey]: newValue
                                            }));

                                            // Debounce save
                                            if (debounceTimerRef.current[cellKey]) {
                                              clearTimeout(debounceTimerRef.current[cellKey]!);
                                            }
                                            debounceTimerRef.current[cellKey] = setTimeout(() => {
                                              handleUpdateGetListedComparisonCell(
                                                row.id,
                                                plan.id,
                                                cell?.tick_enabled ?? false,
                                                newValue,
                                                false // Don't show toast for every keystroke
                                              );
                                            }, 500);
                                          }}
                                          onBlur={() => {
                                            // Save on blur
                                            if (debounceTimerRef.current[cellKey]) {
                                              clearTimeout(debounceTimerRef.current[cellKey]!);
                                            }
                                            handleUpdateGetListedComparisonCell(
                                              row.id,
                                              plan.id,
                                              cell?.tick_enabled ?? false,
                                              currentValue,
                                              false
                                            );
                                          }}
                                          className="w-full px-2 py-1 text-sm rounded border border-input"
                                        />
                                      )}
                                    </div>
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="mt-6">
                  <div className="flex items-center justify-between p-4 bg-muted/100 rounded-xl mb-4">
                    <div>
                      <label className="block text-base font-medium">Comparison Footer Content</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={getListedSettings?.show_comparison_footer ?? true}
                        onCheckedChange={(v) => setGetListedSettings(prev => prev ? { ...prev, show_comparison_footer: v } : null)}
                      />
                      <span className="text-sm text-muted-foreground">{(getListedSettings?.show_comparison_footer ?? true) ? 'Visible' : 'Hidden'}</span>
                    </div>
                  </div>

                  <CKEditor
                    value={getListedSettings?.comparison_footer_content || ''}
                    onChange={(value) => setGetListedSettings(prev => prev ? { ...prev, comparison_footer_content: value } : null)}
                    placeholder="Enter footer notes/content..."
                  />
                </div>

                <div className="mt-4">
                  <label className="block text-base font-medium mb-1.5">Comparison Footer Line</label>
                  <input
                    type="text"
                    value={getListedSettings?.comparison_footer_line || ''}
                    onChange={(e) => setGetListedSettings(prev => prev ? { ...prev, comparison_footer_line: e.target.value } : null)}
                    placeholder="Enter footer line..."
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
              </div>

              {/* Add/Edit Plan Modal */}
              {showAddGetListedPlanModal && (
                <Modal
                  title={editGetListedPlan?.id ? 'Edit Plan' : 'Add Plan'}
                  onClose={() => {
                    setShowAddGetListedPlanModal(false);
                    setEditGetListedPlan(null);
                  }}
                >
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Plan Name</label>
                      <input
                        type="text"
                        value={editGetListedPlan?.plan_name || ''}
                        onChange={(e) => setEditGetListedPlan(prev => prev ? { ...prev, plan_name: e.target.value } : null)}
                        placeholder="Enter plan name..."
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Comparison Table Header (Optional)</label>
                      <input
                        type="text"
                        value={editGetListedPlan?.comparison_header || ''}
                        onChange={(e) => setEditGetListedPlan(prev => prev ? { ...prev, comparison_header: e.target.value } : null)}
                        placeholder="Enter custom header for comparison table (defaults to plan name)..."
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Price (INR)</label>
                      <input
                        type="number"
                        value={editGetListedPlan?.price_inr || 0}
                        onChange={(e) => setEditGetListedPlan(prev => prev ? { ...prev, price_inr: Number(e.target.value) } : null)}
                        placeholder="0"
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Price (USD)</label>
                      <input
                        type="number"
                        value={editGetListedPlan?.price_usd || 0}
                        onChange={(e) => setEditGetListedPlan(prev => prev ? { ...prev, price_usd: Number(e.target.value) } : null)}
                        placeholder="0"
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Duration</label>
                      <input
                        type="text"
                        value={editGetListedPlan?.duration || ''}
                        onChange={(e) => setEditGetListedPlan(prev => prev ? { ...prev, duration: e.target.value } : null)}
                        placeholder="e.g., 1 Month"
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Button Text</label>
                      <input
                        type="text"
                        value={editGetListedPlan?.button_text || ''}
                        onChange={(e) => setEditGetListedPlan(prev => prev ? { ...prev, button_text: e.target.value } : null)}
                        placeholder="e.g., Get Started"
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Button Link (INR)</label>
                      <input
                        type="text"
                        value={editGetListedPlan?.button_link || ''}
                        onChange={(e) => setEditGetListedPlan(prev => prev ? { ...prev, button_link: e.target.value } : null)}
                        placeholder="https://..."
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Button Link (USD)</label>
                      <input
                        type="text"
                        value={editGetListedPlan?.button_link_usd || ''}
                        onChange={(e) => setEditGetListedPlan(prev => prev ? { ...prev, button_link_usd: e.target.value } : null)}
                        placeholder="https://..."
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={editGetListedPlan?.button_visible ?? true}
                        onCheckedChange={(v) => setEditGetListedPlan(prev => prev ? { ...prev, button_visible: v } : null)}
                      />
                      <span className="text-sm text-muted-foreground">Button Visible</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={editGetListedPlan?.popular ?? false}
                        onCheckedChange={(v) => setEditGetListedPlan(prev => prev ? { ...prev, popular: v } : null)}
                      />
                      <span className="text-sm text-muted-foreground">Popular Plan</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={editGetListedPlan?.visible ?? true}
                        onCheckedChange={(v) => setEditGetListedPlan(prev => prev ? { ...prev, visible: v } : null)}
                      />
                      <span className="text-sm text-muted-foreground">Plan Visible</span>
                    </div>

                    <button
                      onClick={handleSaveGetListedPlan}
                      className="w-full px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold"
                    >
                      Save Plan
                    </button>
                  </div>
                </Modal>
              )}

              {/* Add/Edit Comparison Row Modal */}
              {showAddGetListedComparisonRowModal && (
                <Modal
                  title={editGetListedComparisonRow?.id ? 'Edit Row' : 'Add Row'}
                  onClose={() => {
                    setShowAddGetListedComparisonRowModal(false);
                    setEditGetListedComparisonRow(null);
                  }}
                >
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Row Title</label>
                      <input
                        type="text"
                        value={editGetListedComparisonRow?.row_title || ''}
                        onChange={(e) => setEditGetListedComparisonRow(prev => prev ? { ...prev, row_title: e.target.value } : null)}
                        placeholder="e.g., Support"
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={editGetListedComparisonRow?.visible ?? true}
                        onCheckedChange={(v) => setEditGetListedComparisonRow(prev => prev ? { ...prev, visible: v } : null)}
                      />
                      <span className="text-sm text-muted-foreground">Row Visible</span>
                    </div>
                    <button
                      onClick={handleSaveGetListedComparisonRow}
                      className="w-full px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold"
                    >
                      Save Row
                    </button>
                  </div>
                </Modal>
              )}
            </div>
          )}

          {/* FOOTER GENERAL SETTINGS */}
          {tab === 'footer_general' && (
            <div className="max-w-4xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Footer General Settings</h2>
                <button
                  onClick={handleSaveFooter}
                  disabled={isSavingFooter}
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold flex items-center gap-2 hover:bg-primary/90 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {isSavingFooter ? 'Saving...' : 'Save Settings'}
                </button>
              </div>

              <div className="space-y-8 rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div>
                  <h3 className="font-semibold text-base mb-4">Footer Description</h3>

                  <CKEditor
                    value={footerSettings.description}
                    onChange={(value) => setFooterSettings({ ...footerSettings, description: value })}
                    placeholder="Enter footer description..."
                    className="min-h-[120px]"
                  />
                </div>

                <div className="space-y-4 border-t pt-6">
                  <h3 className="font-semibold text-base mb-4">Footer Column Visibility</h3>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium">Vendors Column</label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={footerSettings.vendors_visible ?? true}
                          onCheckedChange={(v) => setFooterSettings({ ...footerSettings, vendors_visible: v })}
                        />
                        <span className="text-xs text-muted-foreground">{(footerSettings.vendors_visible ?? true) ? 'Visible' : 'Hidden'}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium">Buyers Column</label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={footerSettings.buyers_visible ?? true}
                          onCheckedChange={(v) => setFooterSettings({ ...footerSettings, buyers_visible: v })}
                        />
                        <span className="text-xs text-muted-foreground">{(footerSettings.buyers_visible ?? true) ? 'Visible' : 'Hidden'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6 border-t pt-6">
                  <h3 className="font-semibold text-base mb-4">Contact Information</h3>




                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium">WhatsApp Number</label>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={footerSettings.whatsapp_visible ?? false}
                          onCheckedChange={(v) => setFooterSettings({ ...footerSettings, whatsapp_visible: v })}
                        />
                        <span className="text-xs text-muted-foreground">{(footerSettings.whatsapp_visible ?? false) ? 'Visible' : 'Hidden'}</span>
                      </div>
                    </div>
                    <input
                      value={footerSettings.whatsapp_number || ''}
                      onChange={(e) => setFooterSettings({ ...footerSettings, whatsapp_number: e.target.value })}
                      placeholder="e.g., +1 234 567 8900"
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium">Email Address</label>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={footerSettings.email_visible ?? false}
                          onCheckedChange={(v) => setFooterSettings({ ...footerSettings, email_visible: v })}
                        />
                        <span className="text-xs text-muted-foreground">{(footerSettings.email_visible ?? false) ? 'Visible' : 'Hidden'}</span>
                      </div>
                    </div>
                    <input
                      value={footerSettings.email || ''}
                      onChange={(e) => setFooterSettings({ ...footerSettings, email: e.target.value })}
                      placeholder="e.g., contact@example.com"
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium">Bottom Footer Email</label>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={footerSettings.bottom_footer_email_visible ?? false}
                          onCheckedChange={(v) => setFooterSettings({ ...footerSettings, bottom_footer_email_visible: v })}
                        />
                        <span className="text-xs text-muted-foreground">{(footerSettings.bottom_footer_email_visible ?? false) ? 'Visible' : 'Hidden'}</span>
                      </div>
                    </div>
                    <input
                      value={footerSettings.bottom_footer_email || ''}
                      onChange={(e) => setFooterSettings({ ...footerSettings, bottom_footer_email: e.target.value })}
                      placeholder="e.g., support@example.com"
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    />
                  </div>

                </div>

                <div className="space-y-6 border-t pt-6">
                  <h3 className="font-semibold text-base mb-4">Custom Footer Links</h3>

                  <div className="space-y-6">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium">Link 1: Submit RFT</label>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={footerSettings.submit_rft_enabled ?? false}
                            onCheckedChange={(v) => setFooterSettings({ ...footerSettings, submit_rft_enabled: v })}
                          />
                          <span className="text-xs text-muted-foreground">{(footerSettings.submit_rft_enabled ?? false) ? 'Visible' : 'Hidden'}</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-muted-foreground block mb-1">Label</label>
                          <input
                            value={footerSettings.submit_rft_label || 'Submit RFT'}
                            onChange={(e) => setFooterSettings({ ...footerSettings, submit_rft_label: e.target.value })}
                            placeholder="Enter link label..."
                            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground block mb-1">URL</label>
                          <input
                            value={footerSettings.submit_rft_url || ''}
                            onChange={(e) => setFooterSettings({ ...footerSettings, submit_rft_url: e.target.value })}
                            placeholder="Enter URL (internal or external)..."
                            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium">Link 2: Get Recommendations</label>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={footerSettings.get_recommendations_enabled ?? false}
                            onCheckedChange={(v) => setFooterSettings({ ...footerSettings, get_recommendations_enabled: v })}
                          />
                          <span className="text-xs text-muted-foreground">{(footerSettings.get_recommendations_enabled ?? false) ? 'Visible' : 'Hidden'}</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-muted-foreground block mb-1">Label</label>
                          <input
                            value={footerSettings.get_recommendations_label || 'Get Recommendations'}
                            onChange={(e) => setFooterSettings({ ...footerSettings, get_recommendations_label: e.target.value })}
                            placeholder="Enter link label..."
                            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground block mb-1">URL</label>
                          <input
                            value={footerSettings.get_recommendations_url || ''}
                            onChange={(e) => setFooterSettings({ ...footerSettings, get_recommendations_url: e.target.value })}
                            placeholder="Enter URL (internal or external)..."
                            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* WRITE FOR US TAB */}
          {tab === 'write-for-us' && (
            <div className="mx-auto flex w-full max-w-7xl flex-col px-3 md:px-6 space-y-6">
              {/* Footer Visibility Toggle */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-base">Show "Write For Us" in Footer</h3>
                    <p className="text-xs text-muted-foreground mt-1">Toggle visibility of this link in the website footer</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={footerSettings.write_for_us_visible ?? true}
                      onCheckedChange={(v) => setFooterSettings({ ...footerSettings, write_for_us_visible: v })}
                    />
                    <span className="text-sm text-muted-foreground">{(footerSettings.write_for_us_visible ?? true) ? 'Visible' : 'Hidden'}</span>
                  </div>
                </div>
              </div>
              {/* Write For Us Settings */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold">Write For Us Settings</h2>
                  <button
                    onClick={handleSaveWriteForUsSettings}
                    className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold"
                  >
                    Save Settings
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-6">
                  {/* Heading */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium mb-1.5">Page Heading</label>
                    <input
                      type="text"
                      value={writeForUsSettings.heading}
                      onChange={(e) => setWriteForUsSettings({ ...writeForUsSettings, heading: e.target.value })}
                      placeholder="Enter page heading..."
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    />
                  </div>

                  {/* Banner Image */}
                  <div className="space-y-2">
                    <ImageUpload
                      label="Banner Image"
                      value={writeForUsSettings.banner_image_url || null}
                      onChange={(url) => setWriteForUsSettings({ ...writeForUsSettings, banner_image_url: url || '' })}
                      folder="write-for-us"
                    />
                  </div>

                  {/* Content Editor */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium mb-1.5">Page Content</label>
                    <CKEditor
                      value={writeForUsSettings.content}
                      onChange={(content) => setWriteForUsSettings({ ...writeForUsSettings, content })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium mb-1.5">Contact Email</label>
                    <input
                      type="email"
                      value={writeForUsSettings.contact_email}
                      onChange={(e) => setWriteForUsSettings({ ...writeForUsSettings, contact_email: e.target.value })}
                      placeholder="Enter contact email..."
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium mb-1.5">Contact Intro Text</label>
                    <input
                      type="text"
                      value={writeForUsSettings.contact_intro_text}
                      onChange={(e) => setWriteForUsSettings({ ...writeForUsSettings, contact_intro_text: e.target.value })}
                      placeholder="Enter contact intro text..."
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VENDOR GUIDELINES TAB */}
          {tab === 'vendor-guidelines' && (
            <div className="mx-auto flex w-full max-w-7xl flex-col px-3 md:px-6 space-y-6">
              {/* Footer Visibility Toggle */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-base">Show "Vendor Guidelines" in Footer</h3>
                    <p className="text-xs text-muted-foreground mt-1">Toggle visibility of this link in the website footer</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={footerSettings.vendor_guidelines_visible ?? true}
                      onCheckedChange={(v) => setFooterSettings({ ...footerSettings, vendor_guidelines_visible: v })}
                    />
                    <span className="text-sm text-muted-foreground">{(footerSettings.vendor_guidelines_visible ?? true) ? 'Visible' : 'Hidden'}</span>
                  </div>
                </div>
              </div>
              {/* Vendor Guidelines Settings */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold">Vendor Guidelines Settings</h2>
                  <button
                    onClick={handleSaveVendorGuidelinesSettings}
                    className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold"
                  >
                    Save Settings
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-6">
                  {/* Heading */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium mb-1.5">Page Heading</label>
                    <input
                      type="text"
                      value={vendorGuidelinesSettings.heading}
                      onChange={(e) => setVendorGuidelinesSettings({ ...vendorGuidelinesSettings, heading: e.target.value })}
                      placeholder="Enter page heading..."
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    />
                  </div>

                  {/* Content Editor */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium mb-1.5">Page Content</label>
                    <CKEditor
                      value={vendorGuidelinesSettings.content}
                      onChange={(content) => setVendorGuidelinesSettings({ ...vendorGuidelinesSettings, content })}
                    />
                  </div>

                  {/* Contact Email */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium mb-1.5">Contact Email</label>
                    <input
                      type="email"
                      value={vendorGuidelinesSettings.contact_email}
                      onChange={(e) => setVendorGuidelinesSettings({ ...vendorGuidelinesSettings, contact_email: e.target.value })}
                      placeholder="Enter contact email..."
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    />
                  </div>

                  {/* Contact Intro Text */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium mb-1.5">Contact Intro Text</label>
                    <input
                      type="text"
                      value={vendorGuidelinesSettings.contact_intro_text}
                      onChange={(e) => setVendorGuidelinesSettings({ ...vendorGuidelinesSettings, contact_intro_text: e.target.value })}
                      placeholder="Enter contact intro text..."
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* BROWSE ALL DIRECTORIES TAB */}
          {/* BROWSE ALL DIRECTORIES PAGE */}
          {tab === 'browse-all-directories' && (
            <div className="mx-auto flex w-full max-w-7xl flex-col px-3 md:px-6 space-y-6">
              {/* Footer Visibility Toggle */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-base">Show "View All Categories" in Footer</h3>
                    <p className="text-xs text-muted-foreground mt-1">Toggle visibility of this link in the website footer</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={footerSettings.view_all_categories_visible ?? true}
                      onCheckedChange={(v) => setFooterSettings({ ...footerSettings, view_all_categories_visible: v })}
                    />
                    <span className="text-sm text-muted-foreground">{(footerSettings.view_all_categories_visible ?? true) ? 'Visible' : 'Hidden'}</span>
                  </div>
                </div>
              </div>
              {/* Browse All Directories Settings */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold">Browse All Directories Settings</h2>
                  <button
                    onClick={handleSaveBrowseAllDirectoriesSettings}
                    className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold"
                  >
                    Save Settings
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-6">
                  {/* Heading */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium mb-1.5">Page Heading</label>
                    <input
                      type="text"
                      value={browseAllDirectoriesSettings.heading}
                      onChange={(e) => setBrowseAllDirectoriesSettings({ ...browseAllDirectoriesSettings, heading: e.target.value })}
                      placeholder="Enter page heading..."
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* FOOTER SETTINGS */}
          {tab === 'footer' && (
            <div className="max-w-4xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Footer Social Media Links</h2>
                <button
                  onClick={handleSaveFooter}
                  disabled={isSavingFooter}
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold flex items-center gap-2 hover:bg-primary/90 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {isSavingFooter ? 'Saving...' : 'Save Social Links'}
                </button>
              </div>

              <div className="space-y-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
                {/* Twitter */}
                <div className="space-y-4 border-b pb-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-base">Twitter / X</h3>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={footerSettings.twitter_visible ?? true}
                        onCheckedChange={(v) => setFooterSettings({ ...footerSettings, twitter_visible: v })}
                      />
                      <span className="text-sm text-muted-foreground">{(footerSettings.twitter_visible ?? true) ? 'Visible' : 'Hidden'}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Label</label>
                      <input
                        value={footerSettings.twitter_label}
                        onChange={(e) => setFooterSettings({ ...footerSettings, twitter_label: e.target.value })}
                        placeholder="e.g., Twitter"
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Link</label>
                      <input
                        value={footerSettings.twitter_link}
                        onChange={(e) => setFooterSettings({ ...footerSettings, twitter_link: e.target.value })}
                        placeholder="https://twitter.com/..."
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* LinkedIn */}
                <div className="space-y-4 border-b pb-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-base">LinkedIn</h3>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={footerSettings.linkedin_visible ?? true}
                        onCheckedChange={(v) => setFooterSettings({ ...footerSettings, linkedin_visible: v })}
                      />
                      <span className="text-sm text-muted-foreground">{(footerSettings.linkedin_visible ?? true) ? 'Visible' : 'Hidden'}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Label</label>
                      <input
                        value={footerSettings.linkedin_label}
                        onChange={(e) => setFooterSettings({ ...footerSettings, linkedin_label: e.target.value })}
                        placeholder="e.g., LinkedIn"
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Link</label>
                      <input
                        value={footerSettings.linkedin_link}
                        onChange={(e) => setFooterSettings({ ...footerSettings, linkedin_link: e.target.value })}
                        placeholder="https://linkedin.com/in/..."
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Facebook */}
                <div className="space-y-4 border-b pb-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-base">Facebook</h3>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={footerSettings.facebook_visible ?? true}
                        onCheckedChange={(v) => setFooterSettings({ ...footerSettings, facebook_visible: v })}
                      />
                      <span className="text-sm text-muted-foreground">{(footerSettings.facebook_visible ?? true) ? 'Visible' : 'Hidden'}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Label</label>
                      <input
                        value={footerSettings.facebook_label}
                        onChange={(e) => setFooterSettings({ ...footerSettings, facebook_label: e.target.value })}
                        placeholder="e.g., Facebook"
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Link</label>
                      <input
                        value={footerSettings.facebook_link}
                        onChange={(e) => setFooterSettings({ ...footerSettings, facebook_link: e.target.value })}
                        placeholder="https://facebook.com/..."
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Instagram */}
                <div className="space-y-4 border-b pb-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-base">Instagram</h3>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={footerSettings.instagram_visible ?? false}
                        onCheckedChange={(v) => setFooterSettings({ ...footerSettings, instagram_visible: v })}
                      />
                      <span className="text-sm text-muted-foreground">{(footerSettings.instagram_visible ?? false) ? 'Visible' : 'Hidden'}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Label</label>
                      <input
                        value={footerSettings.instagram_label}
                        onChange={(e) => setFooterSettings({ ...footerSettings, instagram_label: e.target.value })}
                        placeholder="e.g., Instagram"
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Link</label>
                      <input
                        value={footerSettings.instagram_link}
                        onChange={(e) => setFooterSettings({ ...footerSettings, instagram_link: e.target.value })}
                        placeholder="https://instagram.com/..."
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* YouTube */}
                <div className="space-y-4 border-b pb-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-base">YouTube</h3>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={footerSettings.youtube_visible ?? false}
                        onCheckedChange={(v) => setFooterSettings({ ...footerSettings, youtube_visible: v })}
                      />
                      <span className="text-sm text-muted-foreground">{(footerSettings.youtube_visible ?? false) ? 'Visible' : 'Hidden'}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Label</label>
                      <input
                        value={footerSettings.youtube_label}
                        onChange={(e) => setFooterSettings({ ...footerSettings, youtube_label: e.target.value })}
                        placeholder="e.g., YouTube"
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Link</label>
                      <input
                        value={footerSettings.youtube_link}
                        onChange={(e) => setFooterSettings({ ...footerSettings, youtube_link: e.target.value })}
                        placeholder="https://youtube.com/..."
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* WhatsApp */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-base">WhatsApp</h3>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={footerSettings.social_whatsapp_visible ?? false}
                        onCheckedChange={(v) => setFooterSettings({ ...footerSettings, social_whatsapp_visible: v })}
                      />
                      <span className="text-sm text-muted-foreground">{(footerSettings.social_whatsapp_visible ?? false) ? 'Visible' : 'Hidden'}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">WhatsApp Number</label>
                    <input
                      value={footerSettings.whatsapp_number}
                      onChange={(e) => setFooterSettings({ ...footerSettings, whatsapp_number: e.target.value })}
                      placeholder="e.g., +1234567890"
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    />
                  </div>
                </div>


              </div>
            </div>
          )}

          {tab === 'footer_contact' && (
            <div className="max-w-4xl space-y-6">
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Page Heading</label>
                    <input
                      value={contactSettings.heading}
                      onChange={(e) => setContactSettings({ ...contactSettings, heading: e.target.value })}
                      placeholder="e.g., Contact"
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-lg font-semibold"
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                    <div className="flex items-center gap-3">
                      <label className="text-sm font-medium">Visible on Footer</label>
                      <Switch
                        checked={contactSettings.is_visible ?? true}
                        onCheckedChange={(v) => setContactSettings({ ...contactSettings, is_visible: v })}
                      />
                    </div>
                    <button
                      onClick={saveContactSettings}
                      disabled={isSavingContact || isLoadingContactSettings}
                      className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold flex items-center gap-2 hover:bg-primary/90 disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      {isSavingContact ? 'Saving...' : 'Save Contact'}
                    </button>
                  </div>
                </div>
              </div>

              {isLoadingContactSettings ? (
                <div className="space-y-6 rounded-2xl border border-border bg-card p-12 shadow-sm text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading contact settings...</p>
                </div>
              ) : (
                <div className="space-y-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
                  <div className="space-y-4">

                    {/* Multiple Contact Emails */}
                    <div className="space-y-4 border-t pt-4">
                      <div className="flex items-center justify-between">
                        <label className="block text-sm font-medium">Contact Emails</label>
                        <button
                          type="button"
                          onClick={() => setContactSettings({
                            ...contactSettings,
                            contact_emails: [...contactSettings.contact_emails, { label: '', email: '' }]
                          })}
                          className="inline-flex items-center gap-2 rounded-lg bg-primary/10 text-primary px-3 py-1.5 text-sm font-medium hover:bg-primary/20"
                        >
                          <Plus className="w-4 h-4" /> Add Email
                        </button>
                      </div>
                      {contactSettings.contact_emails.map((item, index) => (
                        <div key={index} className="flex gap-3 items-start">
                          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs text-muted-foreground mb-1">Label</label>
                              <input
                                value={item.label}
                                onChange={(e) => {
                                  const newEmails = [...contactSettings.contact_emails];
                                  newEmails[index].label = e.target.value;
                                  setContactSettings({ ...contactSettings, contact_emails: newEmails });
                                }}
                                placeholder="e.g., Sales, Support"
                                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-muted-foreground mb-1">Email</label>
                              <input
                                type="email"
                                value={item.email}
                                onChange={(e) => {
                                  const newEmails = [...contactSettings.contact_emails];
                                  newEmails[index].email = e.target.value;
                                  setContactSettings({ ...contactSettings, contact_emails: newEmails });
                                }}
                                placeholder="email@example.com"
                                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                              />
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const newEmails = contactSettings.contact_emails.filter((_, i) => i !== index);
                              setContactSettings({ ...contactSettings, contact_emails: newEmails });
                            }}
                            className="mt-6 text-destructive hover:text-destructive/80 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Single Email Fallback */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      <div>
                        <label className="block text-sm font-medium mb-1.5">Email Label (Legacy)</label>
                        <input
                          value={contactSettings.email_label}
                          onChange={(e) => setContactSettings({ ...contactSettings, email_label: e.target.value })}
                          placeholder="e.g., You can contact our Support Team by email:"
                          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1.5">Email Address (Legacy)</label>
                        <input
                          type="email"
                          value={contactSettings.email}
                          onChange={(e) => setContactSettings({ ...contactSettings, email: e.target.value })}
                          placeholder="e.g., office@freeprivacypolicy.com"
                          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      <div>
                        <label className="block text-sm font-medium mb-1.5">Phone Number</label>
                        <input
                          value={contactSettings.phone}
                          onChange={(e) => setContactSettings({ ...contactSettings, phone: e.target.value })}
                          placeholder="e.g., +1 234 567 890"
                          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1.5">WhatsApp Number</label>
                        <input
                          value={contactSettings.whatsapp}
                          onChange={(e) => setContactSettings({ ...contactSettings, whatsapp: e.target.value })}
                          placeholder="e.g., +1 234 567 890"
                          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1.5">Address</label>
                      <CKEditor
                        value={contactSettings.address}
                        onChange={(value) => setContactSettings({ ...contactSettings, address: value })}
                        placeholder="Enter your address"
                        className="min-h-[80px]"
                      />
                    </div>

                    <div className="border-t pt-4">
                      <label className="block text-sm font-medium mb-1.5">Form Embed (URL or HTML code)</label>
                      <CKEditor
                        value={contactSettings.form_embed}
                        onChange={(value) => setContactSettings({ ...contactSettings, form_embed: value })}
                        placeholder="Enter form URL or full HTML embed code"
                        className="min-h-[120px]"
                      />
                    </div>

                    {/* Nodal Officer */}
                    <div className="border-t pt-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">Nodal Officer</h3>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Visible</span>
                          <Switch
                            checked={contactSettings.nodal_officer_visible ?? true}
                            onCheckedChange={(v) => setContactSettings({ ...contactSettings, nodal_officer_visible: v })}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1.5">Title</label>
                          <input
                            value={contactSettings.nodal_officer_title}
                            onChange={(e) => setContactSettings({ ...contactSettings, nodal_officer_title: e.target.value })}
                            placeholder="e.g., Nodal Officer"
                            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1.5">Name</label>
                          <input
                            value={contactSettings.nodal_officer_name}
                            onChange={(e) => setContactSettings({ ...contactSettings, nodal_officer_name: e.target.value })}
                            placeholder="e.g., John Doe"
                            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1.5">Phone</label>
                          <input
                            value={contactSettings.nodal_officer_phone}
                            onChange={(e) => setContactSettings({ ...contactSettings, nodal_officer_phone: e.target.value })}
                            placeholder="e.g., +1 234 567 890"
                            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1.5">Email</label>
                          <input
                            type="email"
                            value={contactSettings.nodal_officer_email}
                            onChange={(e) => setContactSettings({ ...contactSettings, nodal_officer_email: e.target.value })}
                            placeholder="e.g., nodal@example.com"
                            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Appellate Authority */}
                    <div className="border-t pt-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">Appellate Authority</h3>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Visible</span>
                          <Switch
                            checked={contactSettings.appellate_authority_visible ?? true}
                            onCheckedChange={(v) => setContactSettings({ ...contactSettings, appellate_authority_visible: v })}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1.5">Title</label>
                          <input
                            value={contactSettings.appellate_authority_title}
                            onChange={(e) => setContactSettings({ ...contactSettings, appellate_authority_title: e.target.value })}
                            placeholder="e.g., Appellate Authority"
                            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1.5">Name</label>
                          <input
                            value={contactSettings.appellate_authority_name}
                            onChange={(e) => setContactSettings({ ...contactSettings, appellate_authority_name: e.target.value })}
                            placeholder="e.g., Jane Smith"
                            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1.5">Phone</label>
                          <input
                            value={contactSettings.appellate_authority_phone}
                            onChange={(e) => setContactSettings({ ...contactSettings, appellate_authority_phone: e.target.value })}
                            placeholder="e.g., +1 234 567 890"
                            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1.5">Email</label>
                          <input
                            type="email"
                            value={contactSettings.appellate_authority_email}
                            onChange={(e) => setContactSettings({ ...contactSettings, appellate_authority_email: e.target.value })}
                            placeholder="e.g., appellate@example.com"
                            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-1.5">Description Paragraph 1</label>
                          <CKEditor
                            value={contactSettings.description_1}
                            onChange={(value) => setContactSettings({ ...contactSettings, description_1: value })}
                            placeholder="Enter the first paragraph of description"
                            className="min-h-[100px]"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1.5">Description Paragraph 2</label>
                          <CKEditor
                            value={contactSettings.description_2}
                            onChange={(value) => setContactSettings({ ...contactSettings, description_2: value })}
                            placeholder="Enter the second paragraph of description"
                            className="min-h-[100px]"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'footer_subscribers' && (
            <div className="max-w-6xl space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">Footer Subscribers</h2>
                  <p className="text-sm text-muted-foreground">People who have subscribed from the footer form.</p>
                </div>
                <span className="rounded-full bg-muted px-3 py-1 text-sm font-medium text-muted-foreground">
                  {footerSubscribers.length} subscriber{footerSubscribers.length === 1 ? '' : 's'}
                </span>
              </div>

              <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
                {footerSubscribers.length === 0 ? (
                  <div className="p-10 text-center text-sm text-muted-foreground">
                    No subscribers have been added yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-border text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold">Email</th>
                          <th className="px-4 py-3 text-left font-semibold">Subscribed On</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {footerSubscribers.map((subscriber) => (
                          <tr key={subscriber.id}>
                            <td className="px-4 py-3 font-medium">{subscriber.email}</td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {new Date(subscriber.created_at).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {(tab === 'footer_privacy' || tab === 'footer_terms' || tab === 'footer_about' || tab === 'footer_refund' || tab === 'footer_refund_1' || tab === 'footer_refund_2' || tab === 'footer_refund_3' || tab === 'footer_refund_4') && (
            <div className="max-w-4xl space-y-6">
              {(() => {
                let slug = '';
                let defaultTitle = '';
                if (tab === 'footer_privacy') {
                  slug = 'privacy-policy';
                  defaultTitle = 'Privacy Policy';
                } else if (tab === 'footer_terms') {
                  slug = 'terms-of-service';
                  defaultTitle = 'Terms of Service';
                } else if (tab === 'footer_refund') {
                  slug = 'refund-policy';
                  defaultTitle = 'Refund Policy';
                } else if (tab === 'footer_refund_1') {
                  slug = 'refund-policy-1';
                  defaultTitle = 'Refund Policy 1';
                } else if (tab === 'footer_refund_2') {
                  slug = 'refund-policy-2';
                  defaultTitle = 'Refund Policy 2';
                } else if (tab === 'footer_refund_3') {
                  slug = 'refund-policy-3';
                  defaultTitle = 'Refund Policy 3';
                } else if (tab === 'footer_refund_4') {
                  slug = 'refund-policy-4';
                  defaultTitle = 'Refund Policy 4';
                } else if (tab === 'footer_about') {
                  slug = 'about-us';
                  defaultTitle = 'About Us';
                }

                const page = legalPages.find(p => p.slug === slug);
                const currentTitle = editableLegalTitles[slug] || page?.title || defaultTitle;
                const currentVisible = editableLegalVisibility[slug] ?? page?.is_visible ?? true;

                return (
                  <>
                    <div className="space-y-6">
                      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                        <div className="space-y-6">
                          <div className="space-y-2">
                            <label className="block text-sm font-medium">Page Title</label>
                            <input
                              value={currentTitle}
                              onChange={(e) => {
                                setEditableLegalTitles(prev => ({
                                  ...prev,
                                  [slug]: e.target.value
                                }));
                              }}
                              placeholder="Enter page title"
                              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-lg font-semibold"
                            />
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                            <div className="flex items-center gap-3">
                              <label className="text-sm font-medium">Visible on Footer</label>
                              <Switch
                                checked={currentVisible}
                                onCheckedChange={(checked) => {
                                  setEditableLegalVisibility(prev => ({
                                    ...prev,
                                    [slug]: checked
                                  }));
                                }}
                              />
                            </div>
                            <button
                              onClick={() => saveLegalPage(slug, page?.content || '', currentTitle, currentVisible)}
                              disabled={isSavingLegal}
                              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold flex items-center gap-2 hover:bg-primary/90 disabled:opacity-50"
                            >
                              <Save className="w-4 h-4" />
                              {isSavingLegal ? 'Saving...' : `Save ${currentTitle}`}
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                        <div className="prose prose-sm max-w-none mb-4">
                          <p className="text-muted-foreground">Use the editor below to format your {currentTitle}. You can add headings, lists, and more.</p>
                        </div>
                        <CKEditor
                          value={page?.content || ''}
                          onChange={(newContent) => {
                            setLegalPages(prev => prev.map(p => p.slug === slug ? { ...p, content: newContent } : p));
                          }}
                          className="min-h-[300px]"
                          placeholder={`Enter ${currentTitle} content here...`}
                        />
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          {/* ADD SECTION MODAL */}
          {showAddSectionModal && (
            <Modal
              title="Add New Section"
              onClose={() => {
                setShowAddSectionModal(false);
                setAddSectionType('');
                setAddSectionName('');
              }}
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Section Name</label>
                  <input
                    type="text"
                    value={addSectionName}
                    onChange={(e) => setAddSectionName(e.target.value)}
                    placeholder={`Enter a name for this section`}
                    className="w-full px-4 py-2.5 rounded-lg border border-input bg-background"
                  />
                </div>
                <button
                  onClick={handleAddSection}
                  disabled={addingSectionLoading}
                  className="w-full px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold disabled:opacity-50"
                >
                  {addingSectionLoading ? 'Creating...' : 'Create Section'}
                </button>
              </div>
            </Modal>
          )}

          {/* EDIT HEADING MODAL */}
          {editingHeadingSectionId && (
            <Modal
              title="Edit Section Heading"
              onClose={() => {
                setEditingHeadingSectionId(null);
                setEditingHeadingText('');
              }}
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Heading Text</label>
                  <input
                    type="text"
                    value={editingHeadingText}
                    onChange={(e) => setEditingHeadingText(e.target.value)}
                    placeholder="Enter heading text"
                    className="w-full px-4 py-2.5 rounded-lg border border-input bg-background"
                  />
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <input
                    type="checkbox"
                    checked={editingHeadingVisible}
                    onChange={(e) => setEditingHeadingVisible(e.target.checked)}
                    id="show-heading-toggle"
                    className="w-4 h-4 rounded"
                  />
                  <label htmlFor="show-heading-toggle" className="text-sm font-medium cursor-pointer">
                    Show heading on page
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Background Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={editingHeadingBackgroundColor || '#ffffff'}
                      onChange={(e) => setEditingHeadingBackgroundColor(e.target.value)}
                      className="h-10 w-16 rounded cursor-pointer border border-input"
                    />
                    <input
                      type="text"
                      value={editingHeadingBackgroundColor || ''}
                      onChange={(e) => setEditingHeadingBackgroundColor(e.target.value)}
                      placeholder="#ffffff or leave empty for default"
                      className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    />
                  </div>
                </div>
                <button
                  onClick={handleSaveHeading}
                  className="w-full px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold"
                >
                  Save Heading
                </button>
              </div>
            </Modal>
          )}

        </div>
      </main>
    </div>
  );
}

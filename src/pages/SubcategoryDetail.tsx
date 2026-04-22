import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useScopedSectionInstances, type ScopedPageSection } from '@/hooks/useScopedSectionInstances';
import { Switch } from '@/components/ui/switch';
import ImageUpload from '@/components/admin/ImageUpload';
import ImageCropper from '@/components/admin/ImageCropper';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import FeaturedCards from '@/components/home/FeaturedCards';
import OffersSection from '@/components/home/OffersSection';
import Ads1ColSection from '@/components/home/Ads1ColSection';
import Ads2ColSection from '@/components/home/Ads2ColSection';
import Ads3ColSection from '@/components/home/Ads3ColSection';
import { toast } from 'sonner';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  type DragEndEvent,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Download,
  ArrowLeft,
  Info,
  Play,
  Maximize2,
  X,
  Package,
  ExternalLink,
  CalendarDays,
  FileText,
  GripVertical,
  Pencil,
  Plus,
  Trash2,
  CreditCard,
  Star,
  Image,
  LayoutPanelTop,
  Eye,
} from 'lucide-react';

const db = supabase as any;

const PRODUCT_SECTION_TABLE = 'subcategory_page_sections';
const PRODUCT_CARDS_TABLE = 'subcategory_featured_cards';
const PRODUCT_OFFERS_TABLE = 'subcategory_offers';
const PRODUCT_ADS_2_TABLE = 'subcategory_ads_2col';
const PRODUCT_ADS_3_TABLE = 'subcategory_ads_3col';

type ProductAdminTab = 'layout' | 'cards' | 'offers' | 'ads_1col' | 'ads_2col' | 'ads_3col';

const PRODUCT_ADMIN_TABS: { key: ProductAdminTab; label: string; icon: React.ReactNode }[] = [
  { key: 'layout', label: 'Sections', icon: <LayoutPanelTop className="h-4 w-4" /> },
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

const defaultCategoryButtons = [
  { label: 'Try For Free', link: null, is_visible: true },
  { label: 'Get Quote', link: null, is_visible: true },
  { label: 'Call Now', link: null, is_visible: true },
  { label: 'Contact', link: null, is_visible: true },
];

interface Subcategory {
  id: string;
  name: string;
  link: string | null;
  video_url?: string | null;
  schedule_link?: string | null;
  schedule_link_2?: string | null;
  show_schedule_2_in_separate_tab?: boolean;
  show_schedule_in_separate_tab?: boolean;
  form_link?: string | null;
  show_form_in_separate_tab?: boolean;
  category_id: string;
}

interface Category {
  id: string;
  name: string;
  icon_url: string | null;
  bg_color: string;
  detail_heading?: string | null;
  detail_description?: string | null;
}

interface CategoryButton {
  id?: string;
  category_id: string;
  label: string;
  link?: string | null;
  is_visible: boolean;
  sort_order: number;
}

interface CategoryDownload {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string;
}

interface CategoryProduct {
  id: string;
  title: string;
  link: string;
  sort_order: number;
}

interface ProductCardItem {
  id: string;
  title: string;
  link: string;
}

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
}

interface Ad2Item {
  id: string;
  image_url: string | null;
  link: string | null;
  sort_order: number;
  section_id: string;
  is_fixed: boolean;
  show_border: boolean;
}

interface Ad3Item extends Ad2Item {
  heading: string | null;
  description: string | null;
}

const getYouTubeVideoId = (url: string): string | null => {
  const regexPatterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];

  for (const pattern of regexPatterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
};

const getYouTubeEmbedUrl = (videoId: string): string => `https://www.youtube.com/embed/${videoId}?`;

const normalizeExternalUrl = (url: string) => {
  const trimmedUrl = url.trim();
  if (!trimmedUrl) return null;
  return /^https?:\/\//i.test(trimmedUrl) ? trimmedUrl : `https://${trimmedUrl}`;
};

const getEmbeddableScheduleUrl = (url: string) => {
  const normalizedUrl = normalizeExternalUrl(url);
  if (!normalizedUrl) return null;

  if (normalizedUrl.includes('calendly.com') && !normalizedUrl.includes('embed_domain=')) {
    return normalizedUrl.includes('?') ? `${normalizedUrl}&embed_domain=localhost` : `${normalizedUrl}?embed_domain=localhost`;
  }

  return normalizedUrl;
};

const getSectionDisplayName = (section?: ScopedPageSection | null) => section?.heading?.trim() || section?.name || '';

function SortableAdminItem({
  id,
  children,
  disabled = false,
}: {
  id: string;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id, disabled });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className="flex items-center gap-3 rounded-xl border border-border bg-card p-4"
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
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-card p-5 shadow-2xl"
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

export default function SubcategoryDetail() {
  const { categoryId, subcategoryId } = useParams<{ categoryId: string; subcategoryId: string }>();
  const { isAdmin } = useAuth();
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const {
    sections: productSections,
    addSection: addProductSection,
    deleteSection: deleteProductSection,
    updateSection: updateProductSection,
    refetch: refetchProductSections,
  } = useScopedSectionInstances({
    tableName: PRODUCT_SECTION_TABLE,
    scopeColumn: 'subcategory_id',
    scopeValue: subcategoryId || '',
  });

  const [category, setCategory] = useState<Category | null>(null);
  const [subcategory, setSubcategory] = useState<Subcategory | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [showVideoFullscreen, setShowVideoFullscreen] = useState(false);
  const [downloads, setDownloads] = useState<CategoryDownload[]>([]);
  const [products, setProducts] = useState<CategoryProduct[]>([]);
  const [buttons, setButtons] = useState<CategoryButton[]>([]);
  const [detailHeading, setDetailHeading] = useState('');
  const [detailDescription, setDetailDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [subcategoryLink, setSubcategoryLink] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [scheduleLink, setScheduleLink] = useState('');
  const [showScheduleTab, setShowScheduleTab] = useState(false);
  const [scheduleLink2, setScheduleLink2] = useState('');
  const [showScheduleTab2, setShowScheduleTab2] = useState(false);
  const [formLink, setFormLink] = useState('');
  const [showFormTab, setShowFormTab] = useState(false);

  const [productAdminTab, setProductAdminTab] = useState<ProductAdminTab>('layout');
  const [showAddSectionModal, setShowAddSectionModal] = useState(false);
  const [addSectionType, setAddSectionType] = useState<ProductAdminTab>('cards');
  const [addSectionName, setAddSectionName] = useState('');
  const [headingModalSectionId, setHeadingModalSectionId] = useState('');
  const [headingModalValue, setHeadingModalValue] = useState('');
  const [headingVisible, setHeadingVisible] = useState(true);

  const [productCards, setProductCards] = useState<FeaturedCardItem[]>([]);
  const [productOffers, setProductOffers] = useState<OfferItem[]>([]);
  const [productAds2, setProductAds2] = useState<Ad2Item[]>([]);
  const [productAds3, setProductAds3] = useState<Ad3Item[]>([]);

  const [selectedCardsSectionId, setSelectedCardsSectionId] = useState('');
  const [selectedOffersSectionId, setSelectedOffersSectionId] = useState('');
  const [selectedAds1SectionId, setSelectedAds1SectionId] = useState('');
  const [selectedAds2SectionId, setSelectedAds2SectionId] = useState('');
  const [selectedAds3SectionId, setSelectedAds3SectionId] = useState('');

  const [editCard, setEditCard] = useState<Partial<FeaturedCardItem> | null>(null);
  const [editOffer, setEditOffer] = useState<Partial<OfferItem> | null>(null);
  const [editAd1, setEditAd1] = useState<Partial<Ad2Item> | null>(null);
  const [editAd2, setEditAd2] = useState<Partial<Ad2Item> | null>(null);
  const [editAd3, setEditAd3] = useState<Partial<Ad3Item> | null>(null);

  const scheduleLinkTrimmed = scheduleLink.trim();
  const scheduleLink2Trimmed = scheduleLink2.trim();
  const hasVideoResource = Boolean(videoUrl);
  const showScheduleAsTab = Boolean(scheduleLinkTrimmed && showScheduleTab);
  const showScheduleInResources = Boolean(scheduleLinkTrimmed && !showScheduleTab);
  const showSchedule2AsTab = Boolean(scheduleLink2Trimmed && showScheduleTab2);
  const showSchedule2InResources = Boolean(scheduleLink2Trimmed && !showScheduleTab2);
  const showFormAsTab = Boolean(formLink.trim() && showFormTab);
  const hasResourcesTab = hasVideoResource || showScheduleInResources || showSchedule2InResources;

  const tabs = [
    { key: 'overview', label: 'Overview', icon: <Info className="h-4 w-4" /> },
  ];

  if (hasResourcesTab) tabs.push({ key: 'resources', label: 'Resources', icon: <Play className="h-4 w-4" /> });
  tabs.push({ key: 'downloads', label: 'Downloads', icon: <Download className="h-4 w-4" /> });
  tabs.push({ key: 'products', label: 'Products', icon: <Package className="h-4 w-4" /> });
  if (showScheduleAsTab) tabs.push({ key: 'schedule', label: 'Schedule', icon: <CalendarDays className="h-4 w-4" /> });
  if (showSchedule2AsTab) tabs.push({ key: 'schedule-2', label: 'Schedule 2', icon: <CalendarDays className="h-4 w-4" /> });
  if (showFormAsTab) tabs.push({ key: 'form', label: 'Form', icon: <FileText className="h-4 w-4" /> });

  const resourcesTabIndex = tabs.findIndex((tab) => tab.key === 'resources');
  const downloadsTabIndex = tabs.findIndex((tab) => tab.key === 'downloads');
  const productsTabIndex = tabs.findIndex((tab) => tab.key === 'products');
  const scheduleTabIndex = tabs.findIndex((tab) => tab.key === 'schedule');
  const schedule2TabIndex = tabs.findIndex((tab) => tab.key === 'schedule-2');
  const formTabIndex = tabs.findIndex((tab) => tab.key === 'form');

  const scheduleEmbedUrl = scheduleLinkTrimmed ? getEmbeddableScheduleUrl(scheduleLinkTrimmed) : null;
  const scheduleEmbedUrl2 = scheduleLink2Trimmed ? getEmbeddableScheduleUrl(scheduleLink2Trimmed) : null;

  const productItems: ProductCardItem[] = useMemo(
    () => [
      ...(subcategory && subcategoryLink.trim()
        ? [
            {
              id: `subcategory-${subcategory.id}`,
              title: subcategory.name,
              link: subcategoryLink.trim(),
            },
          ]
        : []),
      ...products.map((product) => ({
        id: `category-product-${product.id}`,
        title: product.title,
        link: product.link,
      })),
    ],
    [products, subcategory, subcategoryLink]
  );

  const selectedCardsSection = productSections.find((section) => section.id === selectedCardsSectionId);
  const selectedOffersSection = productSections.find((section) => section.id === selectedOffersSectionId);
  const selectedAds1Section = productSections.find((section) => section.id === selectedAds1SectionId);
  const selectedAds2Section = productSections.find((section) => section.id === selectedAds2SectionId);
  const selectedAds3Section = productSections.find((section) => section.id === selectedAds3SectionId);

  const selectedCards = useMemo(
    () => productCards.filter((card) => card.section_id === selectedCardsSectionId).sort((a, b) => a.sort_order - b.sort_order),
    [productCards, selectedCardsSectionId]
  );
  const selectedOffers = useMemo(
    () => productOffers.filter((offer) => offer.section_id === selectedOffersSectionId).sort((a, b) => a.sort_order - b.sort_order),
    [productOffers, selectedOffersSectionId]
  );
  const selectedAds1 = useMemo(
    () => productAds2.filter((ad) => ad.section_id === selectedAds1SectionId).sort((a, b) => a.sort_order - b.sort_order),
    [productAds2, selectedAds1SectionId]
  );
  const selectedAds2 = useMemo(
    () => productAds2.filter((ad) => ad.section_id === selectedAds2SectionId).sort((a, b) => a.sort_order - b.sort_order),
    [productAds2, selectedAds2SectionId]
  );
  const selectedAds3 = useMemo(
    () => productAds3.filter((ad) => ad.section_id === selectedAds3SectionId).sort((a, b) => a.sort_order - b.sort_order),
    [productAds3, selectedAds3SectionId]
  );

  const cardsFixedModeEnabled = selectedCards.some((card) => card.is_fixed);
  const offersFixedModeEnabled = selectedOffers.some((offer) => offer.is_fixed);
  const ads1FixedModeEnabled = selectedAds1.some((ad) => ad.is_fixed);
  const ads2FixedModeEnabled = selectedAds2.some((ad) => ad.is_fixed);
  const ads3FixedModeEnabled = selectedAds3.some((ad) => ad.is_fixed);

  const visibleProductSections = useMemo(
    () => productSections.filter((section) => section.is_visible).sort((a, b) => a.sort_order - b.sort_order),
    [productSections]
  );

  const saveCategoryField = async (payload: Partial<Category>) => {
    if (!categoryId) return;
    await supabase.from('categories').update(payload).eq('id', categoryId);
    setCategory((current) => (current ? { ...current, ...payload } : current));
  };

  const loadProductSectionContent = useCallback(async () => {
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

    setProductCards(((cardsData || []) as FeaturedCardItem[]).map((card) => ({ ...card, link: card.link ?? null, is_fixed: card.is_fixed ?? false, show_border: card.show_border ?? false })));
    setProductOffers(((offersData || []) as OfferItem[]).map((offer) => ({ ...offer, link: offer.link ?? null, is_fixed: offer.is_fixed ?? false, show_border: offer.show_border ?? false })));
    setProductAds2(((ads2Data || []) as Ad2Item[]).map((ad) => ({ ...ad, link: ad.link ?? null, is_fixed: ad.is_fixed ?? false, show_border: ad.show_border ?? false })));
    setProductAds3(((ads3Data || []) as Ad3Item[]).map((ad) => ({ ...ad, link: ad.link ?? null, is_fixed: ad.is_fixed ?? false, show_border: ad.show_border ?? false })));
  }, [productSections]);

  useEffect(() => {
    const getFirstSectionIdByType = (sectionType: ProductAdminTab) =>
      productSections.find((section) => section.section_type === sectionType)?.id || '';

    setSelectedCardsSectionId((current) =>
      current && productSections.some((section) => section.id === current) ? current : getFirstSectionIdByType('cards')
    );
    setSelectedOffersSectionId((current) =>
      current && productSections.some((section) => section.id === current) ? current : getFirstSectionIdByType('offers')
    );
    setSelectedAds1SectionId((current) =>
      current && productSections.some((section) => section.id === current) ? current : getFirstSectionIdByType('ads_1col')
    );
    setSelectedAds2SectionId((current) =>
      current && productSections.some((section) => section.id === current) ? current : getFirstSectionIdByType('ads_2col')
    );
    setSelectedAds3SectionId((current) =>
      current && productSections.some((section) => section.id === current) ? current : getFirstSectionIdByType('ads_3col')
    );
  }, [productSections]);

  useEffect(() => {
    loadProductSectionContent();
  }, [loadProductSectionContent]);

  useEffect(() => {
    if (!subcategoryId) return;

    const reload = () => {
      loadProductSectionContent();
    };

    const channels = [
      supabase.channel(`subcategory_cards_${subcategoryId}`).on('postgres_changes', { event: '*', schema: 'public', table: PRODUCT_CARDS_TABLE }, reload).subscribe(),
      supabase.channel(`subcategory_offers_${subcategoryId}`).on('postgres_changes', { event: '*', schema: 'public', table: PRODUCT_OFFERS_TABLE }, reload).subscribe(),
      supabase.channel(`subcategory_ads2_${subcategoryId}`).on('postgres_changes', { event: '*', schema: 'public', table: PRODUCT_ADS_2_TABLE }, reload).subscribe(),
      supabase.channel(`subcategory_ads3_${subcategoryId}`).on('postgres_changes', { event: '*', schema: 'public', table: PRODUCT_ADS_3_TABLE }, reload).subscribe(),
    ];

    return () => {
      channels.forEach((channel) => {
        supabase.removeChannel(channel);
      });
    };
  }, [loadProductSectionContent, subcategoryId]);

  useEffect(() => {
    if (!categoryId || !subcategoryId) return;

    const loadData = async () => {
      const [{ data: categoryData }, { data: subcategoryData }, { data: downloadData }, { data: productData }, { data: buttonData }] = await Promise.all([
        supabase.from('categories').select('*').eq('id', categoryId).single(),
        supabase.from('subcategories').select('*').eq('id', subcategoryId).single(),
        supabase.from('category_downloads').select('*').eq('category_id', categoryId).limit(5),
        supabase.from('category_products' as any).select('*').eq('category_id', categoryId).order('sort_order'),
        supabase.from('category_buttons').select('*').eq('category_id', categoryId).order('sort_order'),
      ]);

      if (categoryData) {
        setCategory(categoryData);
        setDetailHeading(categoryData.detail_heading || `About ${categoryData.name}`);
        setDetailDescription(
          categoryData.detail_description || `Explore all subcategories, download resources, and discover key features related to ${categoryData.name}.`
        );
      }

      if (subcategoryData) {
        const subcat = subcategoryData as any;
        setSubcategory(subcategoryData);
        setSubcategoryLink(subcat.link || '');
        setVideoUrl(subcat.video_url || '');
        setScheduleLink(subcat.schedule_link || '');
        setShowScheduleTab(subcat.show_schedule_in_separate_tab || false);
        setScheduleLink2(subcat.schedule_link_2 || '');
        setShowScheduleTab2(subcat.show_schedule_2_in_separate_tab || false);
        setFormLink(subcat.form_link || '');
        setShowFormTab(subcat.show_form_in_separate_tab || false);
      }

      if (downloadData) setDownloads(downloadData);
      if (productData) setProducts(productData as unknown as CategoryProduct[]);

      if (buttonData && buttonData.length > 0) {
        setButtons(buttonData);
      } else {
        setButtons(
          defaultCategoryButtons.map((button, index) => ({
            id: `default-${index}`,
            category_id: categoryId,
            label: button.label,
            link: button.link || null,
            is_visible: button.is_visible,
            sort_order: index,
          }))
        );
      }
    };

    loadData();

    const channel = supabase
      .channel(`subcategory_detail_${subcategoryId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories', filter: `id=eq.${categoryId}` }, loadData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subcategories', filter: `id=eq.${subcategoryId}` }, loadData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'category_downloads', filter: `category_id=eq.${categoryId}` }, loadData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'category_products', filter: `category_id=eq.${categoryId}` }, loadData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'category_buttons', filter: `category_id=eq.${categoryId}` }, loadData)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [categoryId, subcategoryId]);

  const handleButtonLabelChange = (index: number, value: string) => {
    setButtons((current) => current.map((button, buttonIndex) => (buttonIndex === index ? { ...button, label: value } : button)));
  };

  const handleButtonVisibilityChange = (index: number, value: boolean) => {
    setButtons((current) => current.map((button, buttonIndex) => (buttonIndex === index ? { ...button, is_visible: value } : button)));
  };

  const handleButtonLinkChange = (index: number, value: string) => {
    setButtons((current) => current.map((button, buttonIndex) => (buttonIndex === index ? { ...button, link: value || null } : button)));
  };

  const handleSaveAll = async () => {
    if (!categoryId || !category) return;
    setIsSaving(true);

    try {
      await saveCategoryField({
        detail_heading: detailHeading.trim() || `About ${category.name}`,
        detail_description:
          detailDescription.trim() || `Explore all subcategories, download resources, and discover key features related to ${category.name}.`,
      });

      if (subcategoryId) {
        await supabase
          .from('subcategories')
          .update({
            link: subcategoryLink.trim() || null,
            video_url: videoUrl.trim() || null,
            schedule_link: scheduleLink.trim() || null,
            show_schedule_in_separate_tab: showScheduleTab,
            schedule_link_2: scheduleLink2.trim() || null,
            show_schedule_2_in_separate_tab: showScheduleTab2,
            form_link: formLink.trim() || null,
            show_form_in_separate_tab: showFormTab,
          } as any)
          .eq('id', subcategoryId);
      }

      await supabase.from('category_buttons').delete().eq('category_id', categoryId);

      const buttonPayloads = buttons.map((button, index) => ({
        category_id: categoryId,
        label: button.label.trim() || 'Button',
        link: button.link?.trim() || null,
        is_visible: button.is_visible,
        sort_order: index,
      }));

      if (buttonPayloads.length > 0) {
        await supabase.from('category_buttons').insert(buttonPayloads);
      }

      const { data: refreshedButtons } = await supabase
        .from('category_buttons')
        .select('*')
        .eq('category_id', categoryId)
        .order('sort_order');

      if (refreshedButtons) setButtons(refreshedButtons);
      toast.success('Overview updated.');
    } catch (error) {
      console.error('Error saving subcategory detail:', error);
      toast.error('Failed to save changes.');
    } finally {
      setIsSaving(false);
    }
  };

  const openAddSectionModal = (sectionType: ProductAdminTab = 'cards') => {
    setAddSectionType(sectionType);
    setAddSectionName('');
    setShowAddSectionModal(true);
  };

  const handleAddProductSection = async () => {
    try {
      await addProductSection(addSectionType, addSectionName.trim() || undefined);
      setShowAddSectionModal(false);
      toast.success('Section added.');
    } catch (error) {
      console.error('Error adding product section:', error);
      toast.error('Failed to add section.');
    }
  };

  const openHeadingModal = (sectionId: string) => {
    const section = productSections.find((item) => item.id === sectionId);
    if (!section) return;
    setHeadingModalSectionId(sectionId);
    setHeadingModalValue(section.heading || section.name);
    setHeadingVisible(section.show_heading !== false);
  };

  const saveHeadingModal = async () => {
    if (!headingModalSectionId) return;
    try {
      await updateProductSection(headingModalSectionId, {
        heading: headingModalValue.trim(),
        show_heading: headingVisible,
      });
      setHeadingModalSectionId('');
      toast.success('Section updated.');
    } catch (error) {
      console.error('Error saving section heading:', error);
      toast.error('Failed to update section.');
    }
  };

  const toggleProductSectionVisibility = async (sectionId: string, visible: boolean) => {
    try {
      await updateProductSection(sectionId, { is_visible: visible });
    } catch (error) {
      console.error('Error toggling section visibility:', error);
      toast.error('Failed to update visibility.');
    }
  };

  const handleDeleteProductSection = async (sectionId: string) => {
    if (!window.confirm('Delete this section and its items?')) return;

    try {
      await deleteProductSection(sectionId);
      toast.success('Section deleted.');
    } catch (error) {
      console.error('Error deleting product section:', error);
      toast.error('Failed to delete section.');
    }
  };

  const updateSectionOrder = async (orderedSections: ScopedPageSection[]) => {
    for (const [index, section] of orderedSections.entries()) {
      await db.from(PRODUCT_SECTION_TABLE).update({ sort_order: index }).eq('id', section.id);
    }

    await refetchProductSections();
    toast.success('Section order saved.');
  };

  const handleProductSectionDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = productSections.findIndex((section) => section.id === active.id);
    const newIndex = productSections.findIndex((section) => section.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(productSections, oldIndex, newIndex);
    await updateSectionOrder(reordered);
  };

  const updateItemOrder = async (tableName: string, items: { id: string }[]) => {
    for (const [index, item] of items.entries()) {
      await db.from(tableName).update({ sort_order: index }).eq('id', item.id);
    }
    await loadProductSectionContent();
  };

  const createItemDragHandler = (
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
      await updateItemOrder(tableName, reordered);
      toast.success('Item order saved.');
    };
  };

  const toggleFixedMode = async (tableName: string, sectionId: string, enabled: boolean) => {
    try {
      await db.from(tableName).update({ is_fixed: enabled }).eq('section_id', sectionId);
      await loadProductSectionContent();
      toast.success(`Fixed mode ${enabled ? 'enabled' : 'disabled'}.`);
    } catch (error) {
      console.error('Error toggling fixed mode:', error);
      toast.error('Failed to update fixed mode.');
    }
  };

  const saveCard = async () => {
    if (!editCard?.title?.trim() || !editCard.description?.trim() || !selectedCardsSectionId) {
      toast.error('Title, description, and section are required.');
      return;
    }

    try {
      if (editCard.id) {
        await db
          .from(PRODUCT_CARDS_TABLE)
          .update({
            title: editCard.title.trim(),
            description: editCard.description.trim(),
            logo_url: editCard.logo_url || null,
            link: editCard.link || null,
            show_border: editCard.show_border ?? false,
            is_fixed: cardsFixedModeEnabled,
          })
          .eq('id', editCard.id);
      } else {
        await db.from(PRODUCT_CARDS_TABLE).insert({
          title: editCard.title.trim(),
          description: editCard.description.trim(),
          logo_url: editCard.logo_url || null,
          link: editCard.link || null,
          show_border: editCard.show_border ?? false,
          sort_order: selectedCards.length,
          section_id: selectedCardsSectionId,
          is_fixed: cardsFixedModeEnabled,
        });
      }

      setEditCard(null);
      await loadProductSectionContent();
      toast.success('Card saved.');
    } catch (error) {
      console.error('Error saving card:', error);
      toast.error('Failed to save card.');
    }
  };

  const saveOffer = async () => {
    if (!editOffer?.heading?.trim() || !selectedOffersSectionId) {
      toast.error('Heading and section are required.');
      return;
    }

    try {
      if (editOffer.id) {
        await db
          .from(PRODUCT_OFFERS_TABLE)
          .update({
            heading: editOffer.heading.trim(),
            description: editOffer.description || null,
            image_url: editOffer.image_url || null,
            link: editOffer.link || null,
            show_border: editOffer.show_border ?? false,
            is_fixed: offersFixedModeEnabled,
          })
          .eq('id', editOffer.id);
      } else {
        await db.from(PRODUCT_OFFERS_TABLE).insert({
          heading: editOffer.heading.trim(),
          description: editOffer.description || null,
          image_url: editOffer.image_url || null,
          link: editOffer.link || null,
          show_border: editOffer.show_border ?? false,
          sort_order: selectedOffers.length,
          section_id: selectedOffersSectionId,
          is_fixed: offersFixedModeEnabled,
        });
      }

      setEditOffer(null);
      await loadProductSectionContent();
      toast.success('Offer saved.');
    } catch (error) {
      console.error('Error saving offer:', error);
      toast.error('Failed to save offer.');
    }
  };

  const saveAd1 = async () => {
    if (!selectedAds1SectionId) {
      toast.error('Please select an Ad 1 section.');
      return;
    }

    try {
      if (editAd1?.id) {
        await db
          .from(PRODUCT_ADS_2_TABLE)
          .update({
            image_url: editAd1.image_url || null,
            link: editAd1.link || null,
            show_border: editAd1.show_border ?? false,
            is_fixed: ads1FixedModeEnabled,
          })
          .eq('id', editAd1.id);
      } else {
        await db.from(PRODUCT_ADS_2_TABLE).insert({
          image_url: editAd1?.image_url || null,
          link: editAd1?.link || null,
          show_border: editAd1?.show_border ?? false,
          sort_order: selectedAds1.length,
          section_id: selectedAds1SectionId,
          is_fixed: ads1FixedModeEnabled,
        });
      }

      setEditAd1(null);
      await loadProductSectionContent();
      toast.success('Ad saved.');
    } catch (error) {
      console.error('Error saving ad 1:', error);
      toast.error('Failed to save ad.');
    }
  };

  const saveAd2 = async () => {
    if (!selectedAds2SectionId) {
      toast.error('Please select an Ad 2 section.');
      return;
    }

    try {
      if (editAd2?.id) {
        await db
          .from(PRODUCT_ADS_2_TABLE)
          .update({
            image_url: editAd2.image_url || null,
            link: editAd2.link || null,
            show_border: editAd2.show_border ?? false,
            is_fixed: ads2FixedModeEnabled,
          })
          .eq('id', editAd2.id);
      } else {
        await db.from(PRODUCT_ADS_2_TABLE).insert({
          image_url: editAd2?.image_url || null,
          link: editAd2?.link || null,
          show_border: editAd2?.show_border ?? false,
          sort_order: selectedAds2.length,
          section_id: selectedAds2SectionId,
          is_fixed: ads2FixedModeEnabled,
        });
      }

      setEditAd2(null);
      await loadProductSectionContent();
      toast.success('Ad saved.');
    } catch (error) {
      console.error('Error saving ad 2:', error);
      toast.error('Failed to save ad.');
    }
  };

  const saveAd3 = async () => {
    if (!selectedAds3SectionId) {
      toast.error('Please select an Ad 3 section.');
      return;
    }

    try {
      if (editAd3?.id) {
        await db
          .from(PRODUCT_ADS_3_TABLE)
          .update({
            image_url: editAd3.image_url || null,
            heading: editAd3.heading || null,
            description: editAd3.description || null,
            link: editAd3.link || null,
            show_border: editAd3.show_border ?? false,
            is_fixed: ads3FixedModeEnabled,
          })
          .eq('id', editAd3.id);
      } else {
        await db.from(PRODUCT_ADS_3_TABLE).insert({
          image_url: editAd3?.image_url || null,
          heading: editAd3?.heading || null,
          description: editAd3?.description || null,
          link: editAd3?.link || null,
          show_border: editAd3?.show_border ?? false,
          sort_order: selectedAds3.length,
          section_id: selectedAds3SectionId,
          is_fixed: ads3FixedModeEnabled,
        });
      }

      setEditAd3(null);
      await loadProductSectionContent();
      toast.success('Ad saved.');
    } catch (error) {
      console.error('Error saving ad 3:', error);
      toast.error('Failed to save ad.');
    }
  };

  const deleteItem = async (tableName: string, itemId: string) => {
    try {
      await db.from(tableName).delete().eq('id', itemId);
      await loadProductSectionContent();
      toast.success('Deleted.');
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Failed to delete item.');
    }
  };

  const renderProductSection = (section: ScopedPageSection) => {
    if (section.section_type === 'cards') {
      return (
        <FeaturedCards
          key={section.id}
          sectionId={section.id}
          sectionTable={PRODUCT_SECTION_TABLE}
          cardsTable={PRODUCT_CARDS_TABLE}
        />
      );
    }

    if (section.section_type === 'offers') {
      return (
        <OffersSection
          key={section.id}
          sectionId={section.id}
          sectionTable={PRODUCT_SECTION_TABLE}
          offersTable={PRODUCT_OFFERS_TABLE}
        />
      );
    }

    if (section.section_type === 'ads_1col') {
      return (
        <Ads1ColSection
          key={section.id}
          sectionId={section.id}
          sectionTable={PRODUCT_SECTION_TABLE}
          adsTable={PRODUCT_ADS_2_TABLE}
        />
      );
    }

    if (section.section_type === 'ads_2col') {
      return (
        <Ads2ColSection
          key={section.id}
          sectionId={section.id}
          sectionTable={PRODUCT_SECTION_TABLE}
          adsTable={PRODUCT_ADS_2_TABLE}
        />
      );
    }

    if (section.section_type === 'ads_3col') {
      return (
        <Ads3ColSection
          key={section.id}
          sectionId={section.id}
          sectionTable={PRODUCT_SECTION_TABLE}
          adsTable={PRODUCT_ADS_3_TABLE}
        />
      );
    }

    return null;
  };

  if (!category || !subcategory) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="border-b border-border bg-card">
          <div className="container mx-auto px-4 py-6">
            <Link to={`/category/${categoryId}`} className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" /> Back to {category.name}
            </Link>
            <div className="flex items-center gap-4">
              {category.icon_url && (
                <div className="flex h-14 w-14 items-center justify-center rounded-xl" style={{ backgroundColor: category.bg_color }}>
                  <img src={category.icon_url} alt={category.name} className="h-9 w-9 object-contain" />
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold">{subcategory.name}</h1>
                <p className="mt-1 inline-flex items-center rounded-md border border-border bg-muted px-2.5 py-1 text-xs font-medium text-foreground">
                  {category.name}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-b border-border bg-card">
          <div className="container mx-auto px-4">
            <div className="flex gap-1 overflow-x-auto">
              {tabs.map((tab, index) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(index)}
                  className={`whitespace-nowrap border-b-2 px-5 py-3 text-sm font-medium transition-colors ${
                    activeTab === index ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {tab.icon}
                    {tab.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="container mx-auto w-full px-4 py-8">
          {activeTab === 0 && (
            <div className="w-full space-y-8">
              <div className="w-full md:max-w-3xl">
                <h2 className="mb-4 text-lg font-bold">
                  {isAdmin ? (
                    <input
                      type="text"
                      value={detailHeading}
                      onChange={(event) => setDetailHeading(event.target.value)}
                      className="w-full rounded-lg border border-border bg-transparent px-2 py-1 text-lg font-bold outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                    />
                  ) : (
                    detailHeading || `About ${category.name}`
                  )}
                </h2>
                <p className="mb-6 leading-relaxed text-muted-foreground">
                  {isAdmin ? (
                    <textarea
                      value={detailDescription}
                      onChange={(event) => setDetailDescription(event.target.value)}
                      className="min-h-[88px] w-full resize-none rounded-lg border border-border bg-transparent px-3 py-2 text-sm leading-relaxed outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                    />
                  ) : (
                    detailDescription || `Explore all subcategories, download resources, and discover key features related to ${category.name}.`
                  )}
                </p>

                <div className="flex flex-wrap gap-3">
                  {buttons.filter((button) => button.is_visible).map((button) => (
                    <a
                      key={button.id}
                      href={normalizeExternalUrl(button.link || '') || '#'}
                      target={button.link ? '_blank' : undefined}
                      rel={button.link ? 'noopener noreferrer' : undefined}
                      className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-6 py-2.5 text-sm font-medium transition-colors hover:bg-secondary"
                    >
                      {button.label}
                    </a>
                  ))}
                </div>

                {isAdmin && (
                  <>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      {buttons.map((button, index) => (
                        <div key={button.id || index} className="rounded-xl border border-border bg-card p-4">
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={button.label}
                              onChange={(event) => handleButtonLabelChange(index, event.target.value)}
                              className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                            />
                            <Switch checked={button.is_visible} onCheckedChange={(value) => handleButtonVisibilityChange(index, value)} />
                          </div>
                          <input
                            type="text"
                            value={button.link || ''}
                            onChange={(event) => handleButtonLinkChange(index, event.target.value)}
                            placeholder="Button link"
                            className="mt-2 w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                          />
                          <p className="mt-2 text-xs text-muted-foreground">{button.is_visible ? 'Visible' : 'Hidden'}</p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={handleSaveAll}
                        disabled={isSaving}
                        className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isSaving ? 'Saving...' : 'Save changes'}
                      </button>
                    </div>
                  </>
                )}
              </div>

              {hasResourcesTab && (
                <div className="w-full md:max-w-4xl">
                  <h2 className="mb-6 text-lg font-bold">Resources</h2>
                  <div className="space-y-6">
                    {videoUrl &&
                      (() => {
                        const youtubeId = getYouTubeVideoId(videoUrl);
                        const isYouTube = youtubeId !== null;

                        return (
                          <div className="w-full max-w-[500px] overflow-hidden rounded-xl border border-border bg-card">
                            <div className="group relative aspect-video bg-muted">
                              {isYouTube ? (
                                <iframe
                                  src={getYouTubeEmbedUrl(youtubeId)}
                                  title="Video Resource"
                                  className="h-full w-full"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen
                                />
                              ) : (
                                <>
                                  <video
                                    src={videoUrl}
                                    className="h-full w-full object-cover"
                                    controls
                                    preload="metadata"
                                    poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 9'%3E%3Crect fill='%23e5e7eb' width='16' height='9'/%3E%3C/svg%3E"
                                  />
                                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/40 transition-colors group-hover:bg-black/50">
                                    <div className="cursor-pointer rounded-full bg-primary p-5 text-primary-foreground transition-transform group-hover:scale-110">
                                      <Play className="h-6 w-6 fill-current" />
                                    </div>
                                  </div>
                                </>
                              )}
                            </div>
                            <div className="flex items-center justify-between p-4">
                              <p className="text-sm text-muted-foreground">{isYouTube ? 'YouTube video' : 'Click play icon for fullscreen'}</p>
                              {!isYouTube && (
                                <button type="button" onClick={() => setShowVideoFullscreen(true)} className="rounded-lg p-2 hover:bg-secondary" title="Fullscreen">
                                  <Maximize2 className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })()}

                    {showScheduleInResources && scheduleEmbedUrl && (
                      <div className="w-full overflow-hidden rounded-xl border border-border bg-card md:max-w-[500px]">
                        <div className="relative h-[50vh] w-full bg-muted md:h-[560px]">
                          <iframe src={scheduleEmbedUrl} title="Schedule Meeting" scrolling="auto" className="h-full w-full" style={{ border: 'none' }} />
                        </div>
                        <div className="p-4">
                          <p className="text-sm text-muted-foreground">Schedule a meeting</p>
                        </div>
                      </div>
                    )}

                    {showSchedule2InResources && scheduleEmbedUrl2 && (
                      <div className="w-full overflow-hidden rounded-xl border border-border bg-card md:max-w-[500px]">
                        <div className="relative h-[50vh] w-full bg-muted md:h-[560px]">
                          <iframe src={scheduleEmbedUrl2} title="Schedule Meeting 2" scrolling="auto" className="h-full w-full" style={{ border: 'none' }} />
                        </div>
                        <div className="p-4">
                          <p className="text-sm text-muted-foreground">Schedule a meeting</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="w-full md:max-w-3xl">
                <h2 className="mb-6 text-lg font-bold">Downloads</h2>
                {downloads.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No downloads available.</p>
                ) : (
                  <div className="flex flex-wrap gap-3">
                    {downloads.slice(0, 5).map((download) => (
                      <a
                        key={download.id}
                        href={download.file_url}
                        download
                        className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium transition-colors hover:bg-secondary"
                      >
                        <Download className="h-4 w-4 text-primary" />
                        <span className="max-w-[180px] truncate">{download.file_name}</span>
                      </a>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-8">
                <div className="w-full md:max-w-5xl">
                  <h2 className="mb-6 text-lg font-bold">Products</h2>
                  {productItems.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No product links available.</p>
                  ) : (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {productItems.map((product) => (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() => {
                            const externalUrl = normalizeExternalUrl(product.link);
                            if (externalUrl) {
                              window.open(externalUrl, '_blank', 'noopener,noreferrer');
                            }
                          }}
                          className="flex items-center justify-between rounded-xl border border-border bg-card px-5 py-4 text-left transition-all hover:border-primary/50 hover:shadow-md"
                        >
                          <span className="truncate pr-4 text-base font-medium text-foreground">{product.title}</span>
                          <span className="flex-shrink-0 text-primary">
                            <ExternalLink className="h-4 w-4" />
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {visibleProductSections.map((section) => renderProductSection(section))}

                {productItems.length === 0 && visibleProductSections.length === 0 && (
                  <p className="text-sm text-muted-foreground">No products or Product tab sections available.</p>
                )}
              </div>

              {showScheduleAsTab && scheduleEmbedUrl && (
                <div className="w-full">
                  <h2 className="mb-6 text-lg font-bold">Schedule</h2>
                  <div className="w-full overflow-hidden rounded-xl border border-border bg-card">
                    <div className="h-[50vh] w-full bg-muted md:h-[80vh]">
                      <iframe src={scheduleEmbedUrl} title="Schedule Meeting" scrolling="auto" className="h-full w-full" style={{ border: 'none' }} />
                    </div>
                  </div>
                </div>
              )}

              {showSchedule2AsTab && scheduleEmbedUrl2 && (
                <div className="w-full">
                  <h2 className="mb-6 text-lg font-bold">Schedule 2</h2>
                  <div className="w-full overflow-hidden rounded-xl border border-border bg-card">
                    <div className="h-[50vh] w-full bg-muted md:h-[80vh]">
                      <iframe src={scheduleEmbedUrl2} title="Schedule Meeting 2" scrolling="auto" className="h-full w-full" style={{ border: 'none' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === resourcesTabIndex && hasResourcesTab && (
            <div className="w-full md:max-w-4xl">
              <h2 className="mb-6 text-lg font-bold">Resources</h2>
              <div className="space-y-6">
                {videoUrl &&
                  (() => {
                    const youtubeId = getYouTubeVideoId(videoUrl);
                    const isYouTube = youtubeId !== null;

                    return (
                      <div className="w-full max-w-[500px] overflow-hidden rounded-xl border border-border bg-card">
                        <div className="group relative aspect-video bg-muted">
                          {isYouTube ? (
                            <iframe
                              src={getYouTubeEmbedUrl(youtubeId)}
                              title="Video Resource"
                              className="h-full w-full"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          ) : (
                            <>
                              <video
                                src={videoUrl}
                                className="h-full w-full object-cover"
                                controls
                                preload="metadata"
                                poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 9'%3E%3Crect fill='%23e5e7eb' width='16' height='9'/%3E%3C/svg%3E"
                              />
                              <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/40 transition-colors group-hover:bg-black/50">
                                <div className="cursor-pointer rounded-full bg-primary p-5 text-primary-foreground transition-transform group-hover:scale-110">
                                  <Play className="h-6 w-6 fill-current" />
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                        <div className="flex items-center justify-between p-4">
                          <p className="text-sm text-muted-foreground">{isYouTube ? 'YouTube video' : 'Click play icon for fullscreen'}</p>
                          {!isYouTube && (
                            <button type="button" onClick={() => setShowVideoFullscreen(true)} className="rounded-lg p-2 hover:bg-secondary" title="Fullscreen">
                              <Maximize2 className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                {showScheduleInResources && scheduleEmbedUrl && (
                  <div className="w-full overflow-hidden rounded-xl border border-border bg-card md:max-w-[500px]">
                    <div className="relative h-[50vh] w-full bg-muted md:h-[560px]">
                      <iframe src={scheduleEmbedUrl} title="Schedule Meeting" scrolling="auto" className="h-full w-full" style={{ border: 'none' }} />
                    </div>
                    <div className="p-4">
                      <p className="text-sm text-muted-foreground">Schedule a meeting</p>
                    </div>
                  </div>
                )}

                {showSchedule2InResources && scheduleEmbedUrl2 && (
                  <div className="w-full overflow-hidden rounded-xl border border-border bg-card md:max-w-[500px]">
                    <div className="relative h-[50vh] w-full bg-muted md:h-[560px]">
                      <iframe src={scheduleEmbedUrl2} title="Schedule Meeting 2" scrolling="auto" className="h-full w-full" style={{ border: 'none' }} />
                    </div>
                    <div className="p-4">
                      <p className="text-sm text-muted-foreground">Schedule a meeting</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === downloadsTabIndex && (
            <div className="w-full md:max-w-3xl">
              <h2 className="mb-6 text-lg font-bold">Downloads</h2>
              {downloads.length === 0 ? (
                <p className="text-sm text-muted-foreground">No downloads available.</p>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {downloads.slice(0, 5).map((download) => (
                    <a
                      key={download.id}
                      href={download.file_url}
                      download
                      className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium transition-colors hover:bg-secondary"
                    >
                      <Download className="h-4 w-4 text-primary" />
                      <span className="max-w-[180px] truncate">{download.file_name}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === productsTabIndex && (
            <div className="w-full space-y-8">
              {isAdmin && (
                <div className="rounded-2xl border border-border bg-card p-4 md:p-6">
                  <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h2 className="text-lg font-bold">Product Tab Sections</h2>
                      <p className="text-sm text-muted-foreground">Manage the same Feature Cards, Offers, and Ads blocks used on the homepage.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => openAddSectionModal(productAdminTab === 'layout' ? 'cards' : productAdminTab)}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
                    >
                      <Plus className="h-4 w-4" /> Add Section
                    </button>
                  </div>

                  <div className="mb-5 flex flex-wrap gap-2">
                    {PRODUCT_ADMIN_TABS.map((tab) => (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => setProductAdminTab(tab.key)}
                        className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                          productAdminTab === tab.key
                            ? 'bg-primary text-primary-foreground'
                            : 'border border-border bg-background text-foreground hover:bg-muted'
                        }`}
                      >
                        {tab.icon}
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {productAdminTab === 'layout' && (
                    <div className="space-y-3">
                      {productSections.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No Product tab sections yet.</p>
                      ) : (
                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleProductSectionDragEnd}>
                          <SortableContext items={productSections.map((section) => section.id)} strategy={verticalListSortingStrategy}>
                            <div className="grid gap-3">
                              {productSections.map((section) => (
                                <SortableAdminItem key={section.id} id={section.id}>
                                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                    <div className="min-w-0">
                                      <p className="truncate text-sm font-semibold">{getSectionDisplayName(section)}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {PRODUCT_SECTION_TYPE_OPTIONS.find((item) => item.value === section.section_type)?.label || section.section_type}
                                      </p>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                      <label className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs">
                                        <Eye className="h-3.5 w-3.5" />
                                        <Switch checked={section.is_visible} onCheckedChange={(value) => toggleProductSectionVisibility(section.id, value)} />
                                      </label>
                                      <button type="button" onClick={() => openHeadingModal(section.id)} className="rounded-lg border border-border px-3 py-2 text-xs font-medium">
                                        Edit heading
                                      </button>
                                      <button type="button" onClick={() => handleDeleteProductSection(section.id)} className="rounded-lg bg-destructive px-3 py-2 text-xs font-medium text-destructive-foreground">
                                        Delete
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
                  )}

                  {productAdminTab === 'cards' && (
                    <div className="space-y-4">
                      <div className="flex flex-wrap gap-2">
                        {productSections.filter((section) => section.section_type === 'cards').map((section) => (
                          <button
                            key={section.id}
                            type="button"
                            onClick={() => setSelectedCardsSectionId(section.id)}
                            className={`rounded-lg px-4 py-2 text-sm font-medium ${
                              selectedCardsSectionId === section.id ? 'bg-primary text-primary-foreground' : 'border border-border bg-background hover:bg-muted'
                            }`}
                          >
                            {getSectionDisplayName(section)}
                          </button>
                        ))}
                      </div>

                      {selectedCardsSection ? (
                        <>
                          <div className="flex flex-wrap items-center gap-2">
                            <label className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs">
                              <span>Visible</span>
                              <Switch checked={selectedCardsSection.is_visible} onCheckedChange={(value) => toggleProductSectionVisibility(selectedCardsSection.id, value)} />
                            </label>
                            <label className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs">
                              <span>Fixed Mode</span>
                              <Switch checked={cardsFixedModeEnabled} onCheckedChange={(value) => toggleFixedMode(PRODUCT_CARDS_TABLE, selectedCardsSection.id, value)} />
                            </label>
                            <button type="button" onClick={() => openHeadingModal(selectedCardsSection.id)} className="rounded-lg border border-border px-3 py-2 text-xs font-medium">
                              Edit heading
                            </button>
                            <button type="button" onClick={() => setEditCard({ title: '', description: '', logo_url: null, link: null, show_border: false })} className="rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground">
                              Add card
                            </button>
                          </div>

                          {cardsFixedModeEnabled ? (
                            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={createItemDragHandler(selectedCards, PRODUCT_CARDS_TABLE, cardsFixedModeEnabled)}>
                              <SortableContext items={selectedCards.map((card) => card.id)} strategy={verticalListSortingStrategy}>
                                <div className="grid gap-3">
                                  {selectedCards.map((card) => (
                                    <SortableAdminItem key={card.id} id={card.id} disabled={!cardsFixedModeEnabled}>
                                      <div className="flex items-center gap-4">
                                        {card.logo_url && <img src={card.logo_url} alt="" className="h-12 w-12 rounded-lg bg-muted object-contain p-1" />}
                                        <div className="min-w-0 flex-1">
                                          <h3 className="text-sm font-semibold">{card.title}</h3>
                                          <p className="truncate text-xs text-muted-foreground">{card.description}</p>
                                        </div>
                                        <button type="button" onClick={() => setEditCard(card)} className="text-muted-foreground hover:text-foreground">
                                          <Pencil className="h-4 w-4" />
                                        </button>
                                        <button type="button" onClick={() => deleteItem(PRODUCT_CARDS_TABLE, card.id)} className="text-destructive">
                                          <Trash2 className="h-4 w-4" />
                                        </button>
                                      </div>
                                    </SortableAdminItem>
                                  ))}
                                </div>
                              </SortableContext>
                            </DndContext>
                          ) : (
                            <div className="grid gap-3">
                              {selectedCards.map((card) => (
                                <div key={card.id} className="flex items-center gap-4 rounded-xl border border-border bg-background p-4">
                                  {card.logo_url && <img src={card.logo_url} alt="" className="h-12 w-12 rounded-lg bg-muted object-contain p-1" />}
                                  <div className="min-w-0 flex-1">
                                    <h3 className="text-sm font-semibold">{card.title}</h3>
                                    <p className="truncate text-xs text-muted-foreground">{card.description}</p>
                                  </div>
                                  <button type="button" onClick={() => setEditCard(card)} className="text-muted-foreground hover:text-foreground">
                                    <Pencil className="h-4 w-4" />
                                  </button>
                                  <button type="button" onClick={() => deleteItem(PRODUCT_CARDS_TABLE, card.id)} className="text-destructive">
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground">Add a Feature Cards section to start managing cards here.</p>
                      )}
                    </div>
                  )}

                  {productAdminTab === 'offers' && (
                    <div className="space-y-4">
                      <div className="flex flex-wrap gap-2">
                        {productSections.filter((section) => section.section_type === 'offers').map((section) => (
                          <button
                            key={section.id}
                            type="button"
                            onClick={() => setSelectedOffersSectionId(section.id)}
                            className={`rounded-lg px-4 py-2 text-sm font-medium ${
                              selectedOffersSectionId === section.id ? 'bg-primary text-primary-foreground' : 'border border-border bg-background hover:bg-muted'
                            }`}
                          >
                            {getSectionDisplayName(section)}
                          </button>
                        ))}
                      </div>

                      {selectedOffersSection ? (
                        <>
                          <div className="flex flex-wrap items-center gap-2">
                            <label className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs">
                              <span>Visible</span>
                              <Switch checked={selectedOffersSection.is_visible} onCheckedChange={(value) => toggleProductSectionVisibility(selectedOffersSection.id, value)} />
                            </label>
                            <label className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs">
                              <span>Fixed Mode</span>
                              <Switch checked={offersFixedModeEnabled} onCheckedChange={(value) => toggleFixedMode(PRODUCT_OFFERS_TABLE, selectedOffersSection.id, value)} />
                            </label>
                            <button type="button" onClick={() => openHeadingModal(selectedOffersSection.id)} className="rounded-lg border border-border px-3 py-2 text-xs font-medium">
                              Edit heading
                            </button>
                            <button type="button" onClick={() => setEditOffer({ heading: '', description: '', image_url: null, link: null, show_border: false })} className="rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground">
                              Add offer
                            </button>
                          </div>

                          {offersFixedModeEnabled ? (
                            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={createItemDragHandler(selectedOffers, PRODUCT_OFFERS_TABLE, offersFixedModeEnabled)}>
                              <SortableContext items={selectedOffers.map((offer) => offer.id)} strategy={verticalListSortingStrategy}>
                                <div className="grid gap-3">
                                  {selectedOffers.map((offer) => (
                                    <SortableAdminItem key={offer.id} id={offer.id} disabled={!offersFixedModeEnabled}>
                                      <div className="flex items-center gap-4">
                                        {offer.image_url && <img src={offer.image_url} alt="" className="h-14 w-20 rounded-lg object-cover" />}
                                        <div className="min-w-0 flex-1">
                                          <h3 className="text-sm font-semibold">{offer.heading}</h3>
                                          {offer.description && <p className="truncate text-xs text-muted-foreground">{offer.description}</p>}
                                        </div>
                                        <button type="button" onClick={() => setEditOffer(offer)} className="text-muted-foreground hover:text-foreground">
                                          <Pencil className="h-4 w-4" />
                                        </button>
                                        <button type="button" onClick={() => deleteItem(PRODUCT_OFFERS_TABLE, offer.id)} className="text-destructive">
                                          <Trash2 className="h-4 w-4" />
                                        </button>
                                      </div>
                                    </SortableAdminItem>
                                  ))}
                                </div>
                              </SortableContext>
                            </DndContext>
                          ) : (
                            <div className="grid gap-3">
                              {selectedOffers.map((offer) => (
                                <div key={offer.id} className="flex items-center gap-4 rounded-xl border border-border bg-background p-4">
                                  {offer.image_url && <img src={offer.image_url} alt="" className="h-14 w-20 rounded-lg object-cover" />}
                                  <div className="min-w-0 flex-1">
                                    <h3 className="text-sm font-semibold">{offer.heading}</h3>
                                    {offer.description && <p className="truncate text-xs text-muted-foreground">{offer.description}</p>}
                                  </div>
                                  <button type="button" onClick={() => setEditOffer(offer)} className="text-muted-foreground hover:text-foreground">
                                    <Pencil className="h-4 w-4" />
                                  </button>
                                  <button type="button" onClick={() => deleteItem(PRODUCT_OFFERS_TABLE, offer.id)} className="text-destructive">
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground">Add an Offers section to manage offers here.</p>
                      )}
                    </div>
                  )}

                  {productAdminTab === 'ads_1col' && (
                    <div className="space-y-4">
                      <div className="flex flex-wrap gap-2">
                        {productSections.filter((section) => section.section_type === 'ads_1col').map((section) => (
                          <button
                            key={section.id}
                            type="button"
                            onClick={() => setSelectedAds1SectionId(section.id)}
                            className={`rounded-lg px-4 py-2 text-sm font-medium ${
                              selectedAds1SectionId === section.id ? 'bg-primary text-primary-foreground' : 'border border-border bg-background hover:bg-muted'
                            }`}
                          >
                            {getSectionDisplayName(section)}
                          </button>
                        ))}
                      </div>

                      {selectedAds1Section ? (
                        <>
                          <div className="flex flex-wrap items-center gap-2">
                            <label className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs">
                              <span>Visible</span>
                              <Switch checked={selectedAds1Section.is_visible} onCheckedChange={(value) => toggleProductSectionVisibility(selectedAds1Section.id, value)} />
                            </label>
                            <label className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs">
                              <span>Fixed Mode</span>
                              <Switch checked={ads1FixedModeEnabled} onCheckedChange={(value) => toggleFixedMode(PRODUCT_ADS_2_TABLE, selectedAds1Section.id, value)} />
                            </label>
                            <button type="button" onClick={() => openHeadingModal(selectedAds1Section.id)} className="rounded-lg border border-border px-3 py-2 text-xs font-medium">
                              Edit heading
                            </button>
                            <button type="button" onClick={() => setEditAd1({ image_url: null, link: null, show_border: false })} className="rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground">
                              Add ad
                            </button>
                          </div>

                          {ads1FixedModeEnabled ? (
                            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={createItemDragHandler(selectedAds1, PRODUCT_ADS_2_TABLE, ads1FixedModeEnabled)}>
                              <SortableContext items={selectedAds1.map((ad) => ad.id)} strategy={verticalListSortingStrategy}>
                                <div className="grid gap-3">
                                  {selectedAds1.map((ad, index) => (
                                    <SortableAdminItem key={ad.id} id={ad.id} disabled={!ads1FixedModeEnabled}>
                                      <div className="flex items-center gap-4">
                                        {ad.image_url && <img src={ad.image_url} alt="" className="h-14 w-20 rounded-lg object-cover" />}
                                        <div className="min-w-0 flex-1">
                                          <h3 className="text-sm font-semibold">Ad {index + 1}</h3>
                                        </div>
                                        <button type="button" onClick={() => setEditAd1(ad)} className="text-muted-foreground hover:text-foreground">
                                          <Pencil className="h-4 w-4" />
                                        </button>
                                        <button type="button" onClick={() => deleteItem(PRODUCT_ADS_2_TABLE, ad.id)} className="text-destructive">
                                          <Trash2 className="h-4 w-4" />
                                        </button>
                                      </div>
                                    </SortableAdminItem>
                                  ))}
                                </div>
                              </SortableContext>
                            </DndContext>
                          ) : (
                            <div className="grid gap-3">
                              {selectedAds1.map((ad, index) => (
                                <div key={ad.id} className="flex items-center gap-4 rounded-xl border border-border bg-background p-4">
                                  {ad.image_url && <img src={ad.image_url} alt="" className="h-14 w-20 rounded-lg object-cover" />}
                                  <div className="min-w-0 flex-1">
                                    <h3 className="text-sm font-semibold">Ad {index + 1}</h3>
                                  </div>
                                  <button type="button" onClick={() => setEditAd1(ad)} className="text-muted-foreground hover:text-foreground">
                                    <Pencil className="h-4 w-4" />
                                  </button>
                                  <button type="button" onClick={() => deleteItem(PRODUCT_ADS_2_TABLE, ad.id)} className="text-destructive">
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground">Add an Ad 1 section to manage a single-banner block here.</p>
                      )}
                    </div>
                  )}

                  {productAdminTab === 'ads_2col' && (
                    <div className="space-y-4">
                      <div className="flex flex-wrap gap-2">
                        {productSections.filter((section) => section.section_type === 'ads_2col').map((section) => (
                          <button
                            key={section.id}
                            type="button"
                            onClick={() => setSelectedAds2SectionId(section.id)}
                            className={`rounded-lg px-4 py-2 text-sm font-medium ${
                              selectedAds2SectionId === section.id ? 'bg-primary text-primary-foreground' : 'border border-border bg-background hover:bg-muted'
                            }`}
                          >
                            {getSectionDisplayName(section)}
                          </button>
                        ))}
                      </div>

                      {selectedAds2Section ? (
                        <>
                          <div className="flex flex-wrap items-center gap-2">
                            <label className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs">
                              <span>Visible</span>
                              <Switch checked={selectedAds2Section.is_visible} onCheckedChange={(value) => toggleProductSectionVisibility(selectedAds2Section.id, value)} />
                            </label>
                            <label className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs">
                              <span>Fixed Mode</span>
                              <Switch checked={ads2FixedModeEnabled} onCheckedChange={(value) => toggleFixedMode(PRODUCT_ADS_2_TABLE, selectedAds2Section.id, value)} />
                            </label>
                            <button type="button" onClick={() => openHeadingModal(selectedAds2Section.id)} className="rounded-lg border border-border px-3 py-2 text-xs font-medium">
                              Edit heading
                            </button>
                            <button type="button" onClick={() => setEditAd2({ image_url: null, link: null, show_border: false })} className="rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground">
                              Add ad
                            </button>
                          </div>

                          {ads2FixedModeEnabled ? (
                            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={createItemDragHandler(selectedAds2, PRODUCT_ADS_2_TABLE, ads2FixedModeEnabled)}>
                              <SortableContext items={selectedAds2.map((ad) => ad.id)} strategy={verticalListSortingStrategy}>
                                <div className="grid gap-3">
                                  {selectedAds2.map((ad, index) => (
                                    <SortableAdminItem key={ad.id} id={ad.id} disabled={!ads2FixedModeEnabled}>
                                      <div className="flex items-center gap-4">
                                        {ad.image_url && <img src={ad.image_url} alt="" className="h-14 w-20 rounded-lg object-cover" />}
                                        <div className="min-w-0 flex-1">
                                          <h3 className="text-sm font-semibold">Ad {index + 1}</h3>
                                        </div>
                                        <button type="button" onClick={() => setEditAd2(ad)} className="text-muted-foreground hover:text-foreground">
                                          <Pencil className="h-4 w-4" />
                                        </button>
                                        <button type="button" onClick={() => deleteItem(PRODUCT_ADS_2_TABLE, ad.id)} className="text-destructive">
                                          <Trash2 className="h-4 w-4" />
                                        </button>
                                      </div>
                                    </SortableAdminItem>
                                  ))}
                                </div>
                              </SortableContext>
                            </DndContext>
                          ) : (
                            <div className="grid gap-3">
                              {selectedAds2.map((ad, index) => (
                                <div key={ad.id} className="flex items-center gap-4 rounded-xl border border-border bg-background p-4">
                                  {ad.image_url && <img src={ad.image_url} alt="" className="h-14 w-20 rounded-lg object-cover" />}
                                  <div className="min-w-0 flex-1">
                                    <h3 className="text-sm font-semibold">Ad {index + 1}</h3>
                                  </div>
                                  <button type="button" onClick={() => setEditAd2(ad)} className="text-muted-foreground hover:text-foreground">
                                    <Pencil className="h-4 w-4" />
                                  </button>
                                  <button type="button" onClick={() => deleteItem(PRODUCT_ADS_2_TABLE, ad.id)} className="text-destructive">
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground">Add an Ad 2 section to manage the 2-column ad block here.</p>
                      )}
                    </div>
                  )}

                  {productAdminTab === 'ads_3col' && (
                    <div className="space-y-4">
                      <div className="flex flex-wrap gap-2">
                        {productSections.filter((section) => section.section_type === 'ads_3col').map((section) => (
                          <button
                            key={section.id}
                            type="button"
                            onClick={() => setSelectedAds3SectionId(section.id)}
                            className={`rounded-lg px-4 py-2 text-sm font-medium ${
                              selectedAds3SectionId === section.id ? 'bg-primary text-primary-foreground' : 'border border-border bg-background hover:bg-muted'
                            }`}
                          >
                            {getSectionDisplayName(section)}
                          </button>
                        ))}
                      </div>

                      {selectedAds3Section ? (
                        <>
                          <div className="flex flex-wrap items-center gap-2">
                            <label className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs">
                              <span>Visible</span>
                              <Switch checked={selectedAds3Section.is_visible} onCheckedChange={(value) => toggleProductSectionVisibility(selectedAds3Section.id, value)} />
                            </label>
                            <label className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs">
                              <span>Fixed Mode</span>
                              <Switch checked={ads3FixedModeEnabled} onCheckedChange={(value) => toggleFixedMode(PRODUCT_ADS_3_TABLE, selectedAds3Section.id, value)} />
                            </label>
                            <button type="button" onClick={() => openHeadingModal(selectedAds3Section.id)} className="rounded-lg border border-border px-3 py-2 text-xs font-medium">
                              Edit heading
                            </button>
                            <button type="button" onClick={() => setEditAd3({ image_url: null, heading: '', description: '', link: null, show_border: false })} className="rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground">
                              Add ad
                            </button>
                          </div>

                          {ads3FixedModeEnabled ? (
                            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={createItemDragHandler(selectedAds3, PRODUCT_ADS_3_TABLE, ads3FixedModeEnabled)}>
                              <SortableContext items={selectedAds3.map((ad) => ad.id)} strategy={verticalListSortingStrategy}>
                                <div className="grid gap-3">
                                  {selectedAds3.map((ad) => (
                                    <SortableAdminItem key={ad.id} id={ad.id} disabled={!ads3FixedModeEnabled}>
                                      <div className="flex items-center gap-4">
                                        {ad.image_url && <img src={ad.image_url} alt="" className="h-14 w-20 rounded-lg object-cover" />}
                                        <div className="min-w-0 flex-1">
                                          <h3 className="text-sm font-semibold">{ad.heading || 'Untitled ad'}</h3>
                                          {ad.description && <p className="truncate text-xs text-muted-foreground">{ad.description}</p>}
                                        </div>
                                        <button type="button" onClick={() => setEditAd3(ad)} className="text-muted-foreground hover:text-foreground">
                                          <Pencil className="h-4 w-4" />
                                        </button>
                                        <button type="button" onClick={() => deleteItem(PRODUCT_ADS_3_TABLE, ad.id)} className="text-destructive">
                                          <Trash2 className="h-4 w-4" />
                                        </button>
                                      </div>
                                    </SortableAdminItem>
                                  ))}
                                </div>
                              </SortableContext>
                            </DndContext>
                          ) : (
                            <div className="grid gap-3">
                              {selectedAds3.map((ad) => (
                                <div key={ad.id} className="flex items-center gap-4 rounded-xl border border-border bg-background p-4">
                                  {ad.image_url && <img src={ad.image_url} alt="" className="h-14 w-20 rounded-lg object-cover" />}
                                  <div className="min-w-0 flex-1">
                                    <h3 className="text-sm font-semibold">{ad.heading || 'Untitled ad'}</h3>
                                    {ad.description && <p className="truncate text-xs text-muted-foreground">{ad.description}</p>}
                                  </div>
                                  <button type="button" onClick={() => setEditAd3(ad)} className="text-muted-foreground hover:text-foreground">
                                    <Pencil className="h-4 w-4" />
                                  </button>
                                  <button type="button" onClick={() => deleteItem(PRODUCT_ADS_3_TABLE, ad.id)} className="text-destructive">
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground">Add an Ad 3 section to manage the 3-column ad block here.</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-8">
                <div className="w-full md:max-w-5xl">
                  <h2 className="mb-6 text-lg font-bold">Products</h2>
                  {productItems.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No product links available.</p>
                  ) : (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {productItems.map((product) => (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() => {
                            const externalUrl = normalizeExternalUrl(product.link);
                            if (externalUrl) {
                              window.open(externalUrl, '_blank', 'noopener,noreferrer');
                            }
                          }}
                          className="flex items-center justify-between rounded-xl border border-border bg-card px-5 py-4 text-left transition-all hover:border-primary/50 hover:shadow-md"
                        >
                          <span className="truncate pr-4 text-base font-medium text-foreground">{product.title}</span>
                          <span className="flex-shrink-0 text-primary">
                            <ExternalLink className="h-4 w-4" />
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {visibleProductSections.map((section) => renderProductSection(section))}

                {productItems.length === 0 && visibleProductSections.length === 0 && (
                  <p className="text-sm text-muted-foreground">No products or Product tab sections available.</p>
                )}
              </div>
            </div>
          )}

          {activeTab === scheduleTabIndex && showScheduleAsTab && scheduleEmbedUrl && (
            <div className="w-full">
              <h2 className="mb-6 text-lg font-bold">Schedule</h2>
              <div className="w-full overflow-hidden rounded-xl border border-border bg-card">
                <div className="h-[50vh] w-full bg-muted md:h-[80vh]">
                  <iframe src={scheduleEmbedUrl} title="Schedule Meeting" scrolling="auto" className="h-full w-full" style={{ border: 'none' }} />
                </div>
              </div>
            </div>
          )}

          {activeTab === schedule2TabIndex && showSchedule2AsTab && scheduleEmbedUrl2 && (
            <div className="w-full">
              <h2 className="mb-6 text-lg font-bold">Schedule 2</h2>
              <div className="w-full overflow-hidden rounded-xl border border-border bg-card">
                <div className="h-[50vh] w-full bg-muted md:h-[80vh]">
                  <iframe src={scheduleEmbedUrl2} title="Schedule Meeting 2" scrolling="auto" className="h-full w-full" style={{ border: 'none' }} />
                </div>
              </div>
            </div>
          )}

          {activeTab === formTabIndex && showFormAsTab && formLink.trim() && (
            <div className="w-full">
              <h2 className="mb-6 text-lg font-bold">Form</h2>
              <div className="w-full overflow-hidden rounded-xl border border-border bg-card">
                <div className="h-[60vh] w-full bg-muted md:min-h-[650px]">
                  <iframe src={formLink.trim()} title="Form" scrolling="auto" className="h-full w-full" style={{ border: 'none' }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {showAddSectionModal && (
        <Modal title="Add Product Section" onClose={() => setShowAddSectionModal(false)}>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Section Type</label>
              <select
                value={addSectionType}
                onChange={(event) => setAddSectionType(event.target.value as ProductAdminTab)}
                className="w-full rounded-lg border border-input bg-background px-4 py-2.5"
              >
                {PRODUCT_SECTION_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Section Name</label>
              <input
                value={addSectionName}
                onChange={(event) => setAddSectionName(event.target.value)}
                className="w-full rounded-lg border border-input bg-background px-4 py-2.5"
                placeholder="Optional custom name"
              />
            </div>
            <button type="button" onClick={handleAddProductSection} className="rounded-lg bg-primary px-6 py-2.5 font-semibold text-primary-foreground">
              Save
            </button>
          </div>
        </Modal>
      )}

      {headingModalSectionId && (
        <Modal title="Edit Section Heading" onClose={() => setHeadingModalSectionId('')}>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Heading</label>
              <input
                value={headingModalValue}
                onChange={(event) => setHeadingModalValue(event.target.value)}
                className="w-full rounded-lg border border-input bg-background px-4 py-2.5"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <Switch checked={headingVisible} onCheckedChange={setHeadingVisible} />
              Show heading
            </label>
            <button type="button" onClick={saveHeadingModal} className="rounded-lg bg-primary px-6 py-2.5 font-semibold text-primary-foreground">
              Save
            </button>
          </div>
        </Modal>
      )}

      {editCard && (
        <Modal title={editCard.id ? 'Edit Feature Card' : 'Add Feature Card'} onClose={() => setEditCard(null)}>
          <div className="space-y-4">
            <ImageUpload label="Logo" value={editCard.logo_url || null} onChange={(url) => setEditCard({ ...editCard, logo_url: url })} folder="cards" />
            <div>
              <label className="mb-1.5 block text-sm font-medium">Title</label>
              <input value={editCard.title || ''} onChange={(event) => setEditCard({ ...editCard, title: event.target.value })} className="w-full rounded-lg border border-input bg-background px-4 py-2.5" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Description</label>
              <textarea value={editCard.description || ''} onChange={(event) => setEditCard({ ...editCard, description: event.target.value })} className="w-full rounded-lg border border-input bg-background px-4 py-2.5" rows={3} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Link</label>
              <input value={editCard.link || ''} onChange={(event) => setEditCard({ ...editCard, link: event.target.value || null })} className="w-full rounded-lg border border-input bg-background px-4 py-2.5" />
            </div>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <Switch checked={editCard.show_border ?? false} onCheckedChange={(checked) => setEditCard({ ...editCard, show_border: Boolean(checked) })} />
              <span>Enable Border</span>
            </label>
            <button type="button" onClick={saveCard} className="rounded-lg bg-primary px-6 py-2.5 font-semibold text-primary-foreground">
              Save
            </button>
          </div>
        </Modal>
      )}

      {editOffer && (
        <Modal title={editOffer.id ? 'Edit Offer' : 'Add Offer'} onClose={() => setEditOffer(null)}>
          <div className="space-y-4">
            <ImageCropper label="Offer Image" value={editOffer.image_url || null} onChange={(url) => setEditOffer({ ...editOffer, image_url: url })} folder="offers" previewAspectRatio={16 / 9} previewLabel="Offer Preview" />
            <div>
              <label className="mb-1.5 block text-sm font-medium">Heading</label>
              <input value={editOffer.heading || ''} onChange={(event) => setEditOffer({ ...editOffer, heading: event.target.value })} className="w-full rounded-lg border border-input bg-background px-4 py-2.5" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Description</label>
              <textarea value={editOffer.description || ''} onChange={(event) => setEditOffer({ ...editOffer, description: event.target.value })} className="w-full rounded-lg border border-input bg-background px-4 py-2.5" rows={3} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Link</label>
              <input value={editOffer.link || ''} onChange={(event) => setEditOffer({ ...editOffer, link: event.target.value || null })} className="w-full rounded-lg border border-input bg-background px-4 py-2.5" />
            </div>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <Switch checked={editOffer.show_border ?? false} onCheckedChange={(checked) => setEditOffer({ ...editOffer, show_border: Boolean(checked) })} />
              <span>Enable Border</span>
            </label>
            <button type="button" onClick={saveOffer} className="rounded-lg bg-primary px-6 py-2.5 font-semibold text-primary-foreground">
              Save
            </button>
          </div>
        </Modal>
      )}

      {editAd1 && (
        <Modal title={editAd1.id ? 'Edit Ad 1' : 'Add Ad 1'} onClose={() => setEditAd1(null)}>
          <div className="space-y-4">
            <ImageCropper label="Ad Image" value={editAd1.image_url || null} onChange={(url) => setEditAd1({ ...editAd1, image_url: url })} folder="ads" previewAspectRatio={2 / 1} previewLabel="Ad Preview" />
            <div>
              <label className="mb-1.5 block text-sm font-medium">Link</label>
              <input value={editAd1.link || ''} onChange={(event) => setEditAd1({ ...editAd1, link: event.target.value || null })} className="w-full rounded-lg border border-input bg-background px-4 py-2.5" />
            </div>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <Switch checked={editAd1.show_border ?? false} onCheckedChange={(checked) => setEditAd1({ ...editAd1, show_border: Boolean(checked) })} />
              <span>Enable Border</span>
            </label>
            <button type="button" onClick={saveAd1} className="rounded-lg bg-primary px-6 py-2.5 font-semibold text-primary-foreground">
              Save
            </button>
          </div>
        </Modal>
      )}

      {editAd2 && (
        <Modal title={editAd2.id ? 'Edit Ad 2' : 'Add Ad 2'} onClose={() => setEditAd2(null)}>
          <div className="space-y-4">
            <ImageCropper label="Ad Image" value={editAd2.image_url || null} onChange={(url) => setEditAd2({ ...editAd2, image_url: url })} folder="ads" previewAspectRatio={2 / 1} previewLabel="Ad Preview" />
            <div>
              <label className="mb-1.5 block text-sm font-medium">Link</label>
              <input value={editAd2.link || ''} onChange={(event) => setEditAd2({ ...editAd2, link: event.target.value || null })} className="w-full rounded-lg border border-input bg-background px-4 py-2.5" />
            </div>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <Switch checked={editAd2.show_border ?? false} onCheckedChange={(checked) => setEditAd2({ ...editAd2, show_border: Boolean(checked) })} />
              <span>Enable Border</span>
            </label>
            <button type="button" onClick={saveAd2} className="rounded-lg bg-primary px-6 py-2.5 font-semibold text-primary-foreground">
              Save
            </button>
          </div>
        </Modal>
      )}

      {editAd3 && (
        <Modal title={editAd3.id ? 'Edit Ad 3' : 'Add Ad 3'} onClose={() => setEditAd3(null)}>
          <div className="space-y-4">
            <ImageCropper label="Ad Image" value={editAd3.image_url || null} onChange={(url) => setEditAd3({ ...editAd3, image_url: url })} folder="ads" previewAspectRatio={16 / 9} previewLabel="Ad Preview" />
            <div>
              <label className="mb-1.5 block text-sm font-medium">Heading</label>
              <input value={editAd3.heading || ''} onChange={(event) => setEditAd3({ ...editAd3, heading: event.target.value || null })} className="w-full rounded-lg border border-input bg-background px-4 py-2.5" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Description</label>
              <textarea value={editAd3.description || ''} onChange={(event) => setEditAd3({ ...editAd3, description: event.target.value || null })} className="w-full rounded-lg border border-input bg-background px-4 py-2.5" rows={3} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Link</label>
              <input value={editAd3.link || ''} onChange={(event) => setEditAd3({ ...editAd3, link: event.target.value || null })} className="w-full rounded-lg border border-input bg-background px-4 py-2.5" />
            </div>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <Switch checked={editAd3.show_border ?? false} onCheckedChange={(checked) => setEditAd3({ ...editAd3, show_border: Boolean(checked) })} />
              <span>Enable Border</span>
            </label>
            <button type="button" onClick={saveAd3} className="rounded-lg bg-primary px-6 py-2.5 font-semibold text-primary-foreground">
              Save
            </button>
          </div>
        </Modal>
      )}

      {showVideoFullscreen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black p-4">
          <button type="button" onClick={() => setShowVideoFullscreen(false)} className="absolute right-4 top-4 rounded-lg p-2 transition-colors hover:bg-white/10" title="Close">
            <X className="h-6 w-6 text-white" />
          </button>
          <video
            src={videoUrl}
            controls
            autoPlay
            preload="auto"
            crossOrigin="anonymous"
            className="max-h-full max-w-full"
            style={{ width: '95vw', height: '95vh', objectFit: 'contain' }}
          />
        </div>
      )}

      <Footer />
    </div>
  );
}

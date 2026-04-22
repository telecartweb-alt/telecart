import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSectionInstances } from '@/hooks/useSectionInstances';
import { toast } from 'sonner';
import ImageUpload from '@/components/admin/ImageUpload';
import ImageCropper from '@/components/admin/ImageCropper';
import FileUpload from '@/components/admin/FileUpload';
import { Switch } from '@/components/ui/switch';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  GripVertical, Plus, Pencil, Trash2, LogOut, Home, X, Save,
  LayoutDashboard, Type, Layers, CreditCard, Tag, Star, Image, Lock, Unlock
} from 'lucide-react';

interface PageSection { id: string; section_type: string; name: string; sort_order: number; is_visible: boolean; is_locked: boolean; heading: string; description: string | null; show_heading: boolean; }
interface FeaturedCard { id: string; title: string; description: string; logo_url: string | null; link: string | null; sort_order: number; section_id: string; is_fixed: boolean; show_border: boolean; }
interface Category { id: string; name: string; icon_url: string | null; bg_color: string; sort_order: number; section_id: string; }
interface Subcategory { id: string; category_id: string; name: string; link: string | null; video_url?: string | null; schedule_link?: string | null; show_schedule_in_separate_tab?: boolean; schedule_link_2?: string | null; show_schedule_2_in_separate_tab?: boolean; sort_order: number; }
interface CategoryDownload { id: string; category_id: string; file_name: string; file_url: string; file_type: string; }
interface Offer { id: string; image_url: string | null; heading: string; description: string | null; link: string | null; sort_order: number; section_id: string; is_fixed: boolean; show_border: boolean; }
interface Ad2 { id: string; image_url: string | null; link: string | null; sort_order: number; section_id: string; is_fixed: boolean; show_border: boolean; }
interface Ad3 { id: string; image_url: string | null; heading: string | null; description: string | null; link: string | null; sort_order: number; section_id: string; is_fixed: boolean; show_border: boolean; }

type Tab = 'dashboard' | 'hero' | 'sections' | 'cards' | 'categories' | 'offers' | 'ads_1col' | 'ads_2col' | 'ads_3col';

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

const SIDEBAR_ITEMS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { key: 'hero', label: 'Hero Section', icon: <Type className="w-5 h-5" /> },
  { key: 'sections', label: 'Page Layout', icon: <Layers className="w-5 h-5" /> },
  { key: 'cards', label: 'Feature Cards', icon: <CreditCard className="w-5 h-5" /> },
  { key: 'categories', label: 'Categories', icon: <Tag className="w-5 h-5" /> },
  { key: 'offers', label: 'Offers', icon: <Star className="w-5 h-5" /> },
  { key: 'ads_1col', label: '1-Col Ad', icon: <Image className="w-5 h-5" /> },
  { key: 'ads_2col', label: '2-Col Ads', icon: <Image className="w-5 h-5" /> },
  { key: 'ads_3col', label: '3-Col Ads', icon: <Image className="w-5 h-5" /> },
];

export default function AdminDashboard() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

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
  const [heroText, setHeroText] = useState('');
  const [heroWords, setHeroWords] = useState('');
  const [cards, setCards] = useState<FeaturedCard[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [categoryDownloads, setCategoryDownloads] = useState<CategoryDownload[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [ads2, setAds2] = useState<Ad2[]>([]);
  const [ads3, setAds3] = useState<Ad3[]>([]);

  const [editCard, setEditCard] = useState<Partial<FeaturedCard> | null>(null);
  const [editCategory, setEditCategory] = useState<Partial<Category> | null>(null);
  const [editSubs, setEditSubs] = useState<Subcategory[]>([]);
  const [editDownloads, setEditDownloads] = useState<Partial<CategoryDownload>[]>([]);
  const [editOffer, setEditOffer] = useState<Partial<Offer> | null>(null);
  const [editAd2, setEditAd2] = useState<Partial<Ad2> | null>(null);
  const [editAd3, setEditAd3] = useState<Partial<Ad3> | null>(null);
  const [editAd1, setEditAd1] = useState<Partial<Ad2> | null>(null);

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

  // Track which section instance is being edited for each type
  const [selectedCardsSectionId, setSelectedCardsSectionId] = useState<string>('');
  const [selectedCategoriesSectionId, setSelectedCategoriesSectionId] = useState<string>('');
  const [selectedOffersSectionId, setSelectedOffersSectionId] = useState<string>('');
  const [selectedAds2SectionId, setSelectedAds2SectionId] = useState<string>('');
  const [selectedAds3SectionId, setSelectedAds3SectionId] = useState<string>('');
  const [selectedAds1SectionId, setSelectedAds1SectionId] = useState<string>('');

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

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
    if (!loading && (!user || !isAdmin)) navigate('/admin/login');
  }, [loading, user, isAdmin]);

  useEffect(() => {
    loadAll();

    const channel = supabase
      .channel('admin_dashboard_live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'page_sections' }, loadAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'hero_settings' }, loadAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'featured_cards' }, loadAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, loadAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subcategories' }, loadAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'category_downloads' }, loadAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'offers' }, loadAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ads_2col' }, loadAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ads_3col' }, loadAll)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function loadAll() {
    const [s, h, c, cat, sub, downloads, o, a2, a3] = await Promise.all([
      supabase.from('page_sections').select('*').order('sort_order'),
      supabase.from('hero_settings').select('*').limit(1).single(),
      supabase.from('featured_cards').select('*').order('sort_order'),
      supabase.from('categories').select('*').order('sort_order'),
      supabase.from('subcategories').select('*').order('sort_order'),
      supabase.from('category_downloads').select('*'),
      supabase.from('offers').select('*').order('sort_order'),
      supabase.from('ads_2col').select('*').order('sort_order'),
      supabase.from('ads_3col').select('*').order('sort_order'),
    ]);
    if (s.data) setSections(s.data);
    if (h.data) { setHeroText(h.data.main_text); setHeroWords(h.data.animated_words.join(', ')); }
    if (c.data) setCards((c.data as any[]).map(card => ({ ...card, link: card.link ?? null, is_fixed: card.is_fixed ?? false, show_border: card.show_border ?? false })));
    if (cat.data) setCategories(cat.data);
    if (sub.data) setSubcategories(sub.data);
    if (downloads.data) setCategoryDownloads(downloads.data);
    if (o.data) setOffers((o.data as any[]).map(offer => ({ ...offer, is_fixed: offer.is_fixed ?? false, show_border: offer.show_border ?? false })));
    if (a2.data) setAds2((a2.data as any[]).map(ad => ({ ...ad, is_fixed: ad.is_fixed ?? false, show_border: ad.show_border ?? false })));
    if (a3.data) setAds3((a3.data as any[]).map(ad => ({ ...ad, is_fixed: ad.is_fixed ?? false, show_border: ad.show_border ?? false })));
  }

  function getSectionDisplayName(section: PageSection | undefined) {
    return section?.heading?.trim() || section?.name || '';
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

  async function saveHero() {
    const words = heroWords.split(',').map(w => w.trim()).filter(Boolean);
    const { data } = await supabase.from('hero_settings').select('id').limit(1).single();
    if (data) {
      await supabase.from('hero_settings').update({ main_text: heroText, animated_words: words }).eq('id', data.id);
    }
    toast.success('Hero saved!');
  }

  async function saveCard() {
    if (!editCard) return;
    if (!editCard.title?.trim() || !editCard.description?.trim()) {
      toast.error('Title and description are required.');
      return;
    }
    try {
      if (editCard.id) {
        const updateData: any = { title: editCard.title.trim(), description: editCard.description.trim(), logo_url: editCard.logo_url, link: editCard.link || null, show_border: editCard.show_border ?? false };
        if (cardsFixedModeEnabled !== undefined) {
          updateData.is_fixed = cardsFixedModeEnabled;
        }
        const { error } = await supabase.from('featured_cards').update(updateData).eq('id', editCard.id);
        if (error) throw error;
      } else {
        const insertData: any = { title: editCard.title.trim(), description: editCard.description.trim(), logo_url: editCard.logo_url, link: editCard.link || null, show_border: editCard.show_border ?? false, sort_order: cards.length, section_id: selectedCardsSectionId };
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
      console.error('Error saving card:', error);
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
      console.error('Error deleting card:', error);
      toast.error('Failed to delete card.');
    }
  }

  async function updateOfferSortOrder(offerId: string, newOrder: number) {
    try {
      const { error } = await supabase.from('offers').update({ sort_order: newOrder }).eq('id', offerId);
      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Error updating offer order:', err);
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
      console.error('Error updating card order:', err);
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
      console.error('Error updating ad order:', err);
      toast.error('Failed to save ad order.');
      return false;
    }
  }

  async function updateAds3SortOrder(adId: string, newOrder: number) {
    try {
      const { error } = await supabase.from('ads_3col').update({ sort_order: newOrder }).eq('id', adId);
      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Error updating ad order:', err);
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
      const errorMessage = err && typeof err === 'object' && 'message' in err ? (err as any).message : String(err);
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
      const errorMessage = err && typeof err === 'object' && 'message' in err ? (err as any).message : String(err);
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
      const errorMessage = err && typeof err === 'object' && 'message' in err ? (err as any).message : String(err);
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
      const errorMessage = err && typeof err === 'object' && 'message' in err ? (err as any).message : String(err);
      console.error('Error toggling fixed mode:', err);
      toast.error(`Failed to update Fixed Mode: ${errorMessage}`);
      return false;
    }
  }

  async function deleteCategory(id: string) {
    try {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
      loadAll();
      toast.success('Deleted!');
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Failed to delete category.');
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

    try {
      let categoryId = editCategory.id;

      // Save category
      if (categoryId) {
        // Update existing category
        const { error: catError } = await supabase
          .from('categories')
          .update({
            name: editCategory.name,
            icon_url: editCategory.icon_url,
            bg_color: editCategory.bg_color,
            section_id: selectedCategoriesSectionId
          })
          .eq('id', categoryId);
        if (catError) throw catError;
      } else {
        // Create new category
        const { data: newCat, error: catError } = await supabase
          .from('categories')
          .insert({
            name: editCategory.name,
            icon_url: editCategory.icon_url,
            bg_color: editCategory.bg_color,
            section_id: selectedCategoriesSectionId,
            sort_order: categories.length
          })
          .select()
          .single();
        if (catError) throw catError;
        categoryId = newCat.id;
      }

      // Save subcategories
      if (categoryId) {
        // Delete existing subcategories
        await supabase.from('subcategories').delete().eq('category_id', categoryId);

        // Insert new subcategories
        if (editSubs.length > 0) {
          const subsToInsert = editSubs.map((sub, index) => ({
            id: sub.id,
            category_id: categoryId,
            name: sub.name,
            link: sub.link,
            video_url: sub.video_url,
            schedule_link: sub.schedule_link,
            show_schedule_in_separate_tab: sub.show_schedule_in_separate_tab ?? false,
            schedule_link_2: sub.schedule_link_2 || null,
            show_schedule_2_in_separate_tab: sub.show_schedule_2_in_separate_tab ?? false,
            sort_order: index
          }));
          const { error: subError } = await supabase.from('subcategories').insert(subsToInsert);
          if (subError) throw subError;
        }

        // Save downloads
        // Delete existing downloads
        await supabase.from('category_downloads').delete().eq('category_id', categoryId);

        // Insert new downloads
        if (editDownloads.length > 0) {
          const validDownloads = editDownloads.filter(download => download.file_name && download.file_url && download.file_type);
          const downloadsToInsert = validDownloads.map(download => ({
            category_id: categoryId,
            file_name: download.file_name!,
            file_url: download.file_url!,
            file_type: download.file_type!
          }));
          if (downloadsToInsert.length > 0) {
            const { error: downloadError } = await supabase.from('category_downloads').insert(downloadsToInsert);
            if (downloadError) throw downloadError;
          }
        }
      }

      loadAll();
      setEditCategory(null);
      setEditSubs([]);
      setEditDownloads([]);
      toast.success('Category saved!');
    } catch (error) {
      console.error('Error saving category:', error);
      toast.error('Failed to save category.');
    }
  }

  async function saveOffer() {
    if (!editOffer) return;
    if (!editOffer.heading?.trim()) {
      toast.error('Heading is required.');
      return;
    }
    try {
      const selectedOffersCount = selectedOffers.length;

      if (editOffer.id) {
        const updateData: any = { heading: editOffer.heading.trim(), description: editOffer.description, image_url: editOffer.image_url, link: editOffer.link, show_border: editOffer.show_border ?? false };
        if (offersFixedModeEnabled !== undefined) {
          updateData.is_fixed = offersFixedModeEnabled;
        }
        const { error } = await supabase.from('offers').update(updateData).eq('id', editOffer.id);
        if (error) throw error;
      } else {
        const insertData: any = {
          heading: editOffer.heading.trim(),
          description: editOffer.description,
          image_url: editOffer.image_url,
          link: editOffer.link,
          show_border: editOffer.show_border ?? false,
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
      console.error('Error saving offer:', error);
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
      console.error('Error deleting offer:', error);
      toast.error('Failed to delete offer.');
    }
  }

  async function saveAd2() {
    if (!editAd2) return;
    try {
      if (editAd2.id) {
        const updateData: any = { image_url: editAd2.image_url, link: editAd2.link, show_border: editAd2.show_border ?? false };
        if (ads2FixedModeEnabled !== undefined) {
          updateData.is_fixed = ads2FixedModeEnabled;
        }
        const { error } = await supabase.from('ads_2col').update(updateData).eq('id', editAd2.id);
        if (error) throw error;
      } else {
        const insertData: any = { image_url: editAd2.image_url, link: editAd2.link, show_border: editAd2.show_border ?? false, sort_order: ads2.length, section_id: selectedAds2SectionId };
        if (ads2FixedModeEnabled !== undefined) {
          insertData.is_fixed = ads2FixedModeEnabled;
        }
        const { error } = await supabase.from('ads_2col').insert(insertData);
        if (error) throw error;
      }
      setEditAd2(null); loadAll(); toast.success('Ad saved!');
    } catch (error) {
      console.error('Error saving ad:', error);
      toast.error('Failed to save ad.');
    }
  }

  async function saveAd1() {
    if (!editAd1) return;
    try {
      if (editAd1.id) {
        const updateData: any = { image_url: editAd1.image_url, link: editAd1.link, show_border: editAd1.show_border ?? false };
        if (ads1FixedModeEnabled !== undefined) {
          updateData.is_fixed = ads1FixedModeEnabled;
        }
        const { error } = await supabase.from('ads_2col').update(updateData).eq('id', editAd1.id);
        if (error) throw error;
      } else {
        const insertData: any = { image_url: editAd1.image_url, link: editAd1.link, show_border: editAd1.show_border ?? false, sort_order: selectedAds1.length, section_id: selectedAds1SectionId };
        if (ads1FixedModeEnabled !== undefined) {
          insertData.is_fixed = ads1FixedModeEnabled;
        }
        const { error } = await supabase.from('ads_2col').insert(insertData);
        if (error) throw error;
      }
      setEditAd1(null); loadAll(); toast.success('Ad saved!');
    } catch (error) {
      console.error('Error saving ad:', error);
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
      console.error('Error deleting ad:', error);
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
      console.error('Error saving ad:', error);
      toast.error('Failed to save ad.');
    }
  }

  async function deleteAd3(id: string) {
    try {
      const { error } = await supabase.from('ads_3col').delete().eq('id', id);
      if (error) throw error;
      loadAll();
      toast.success('Deleted!');
    } catch (error) {
      console.error('Error deleting ad:', error);
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
      console.error('Error adding section:', error);
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
    }
  }

  // Handle saving heading
  async function handleSaveHeading() {
    if (!editingHeadingSectionId) return;
    
    try {
      const success1 = await updateHeading(editingHeadingSectionId, editingHeadingText);
      const success2 = await toggleShowHeading(editingHeadingSectionId, editingHeadingVisible);
      
      if (success1 && success2) {
        toast.success('Heading updated!');
        setEditingHeadingSectionId(null);
        // Refetch sections
        const { data: updatedSections } = await supabase
          .from('page_sections')
          .select('*')
          .order('sort_order', { ascending: true });
        if (updatedSections) setSections(updatedSections);
      }
    } catch (error) {
      console.error('Error saving heading:', error);
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
            <button
              key={item.key}
              onClick={() => { setTab(item.key); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-2 md:gap-3 px-2 md:px-3 py-2 md:py-2.5 rounded-lg text-xs md:text-sm font-medium transition-colors ${
                tab === item.key
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              }`}
            >
              <span className="w-5 h-5 flex-shrink-0">{item.icon}</span>
              <span className="truncate">{item.label}</span>
            </button>
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
              <h2 className="text-xl font-bold mb-4">Edit Hero Section</h2>
              <div>
                <label className="block text-sm font-medium mb-1.5">Main Text</label>
                <input value={heroText} onChange={(e) => setHeroText(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-input bg-background" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Animated Words (comma-separated)</label>
                <input value={heroWords} onChange={(e) => setHeroWords(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-input bg-background" />
              </div>
              <button onClick={saveHero} className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold flex items-center gap-2">
                <Save className="w-4 h-4" /> Save Hero
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
                        else if (s.section_type === 'ads_2col') itemCount = ads2.filter(a => a.section_id === s.id).length;
                        else if (s.section_type === 'ads_3col') itemCount = ads3.filter(a => a.section_id === s.id).length;

                        return (
                          <SortableItem key={s.id} id={s.id} disabled={s.is_locked}>
                            <div className="bg-card border border-border rounded-lg p-3 md:p-4 hover:border-primary/50 transition-colors group">
                              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:mb-0">
                                <div className="flex items-start md:items-center gap-2 md:gap-3 flex-1 min-w-0">
                                  <GripVertical className="w-6 md:w-8 h-6 md:h-8 text-muted-foreground cursor-grab active:cursor-grabbing opacity-50 group-hover:opacity-100 flex-shrink-0 mt-1 md:mt-0" />
                                  <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-sm md:text-base break-words">{s.name}</h3>
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
                        className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                          selectedCardsSectionId === section.id
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
                      onClick={() => setEditCard({ title: '', description: '', logo_url: null, link: null, show_border: false })}
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
                            <p className="text-xs text-muted-foreground truncate">{card.description}</p>
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
                        <p className="text-xs text-muted-foreground truncate">{card.description}</p>
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
                      <textarea value={editCard.description || ''} onChange={(e) => setEditCard({ ...editCard, description: e.target.value })} className="w-full px-4 py-2.5 rounded-lg border border-input bg-background" rows={3} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Link (optional)</label>
                      <input value={editCard.link || ''} onChange={(e) => setEditCard({ ...editCard, link: e.target.value || null })} className="w-full px-4 py-2.5 rounded-lg border border-input bg-background" />
                    </div>
                    <label className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Switch checked={editCard.show_border ?? false} onCheckedChange={(checked) => setEditCard({ ...editCard, show_border: Boolean(checked) })} />
                      <span>Enable Border</span>
                    </label>
                    <button onClick={saveCard} className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold">Save</button>
                  </div>
                </Modal>
              )}
            </div>
          )}

          {/* CATEGORIES */}
          {tab === 'categories' && (
            <div>
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
                        className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                          selectedCategoriesSectionId === section.id
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
                      onClick={() => { setEditCategory({ name: '', bg_color: '#FFF9C4', icon_url: null }); setEditSubs([]); setEditDownloads([]); }}
                      className="px-3 py-2 md:px-4 md:py-2 rounded-lg bg-primary text-primary-foreground text-xs md:text-sm font-semibold flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      <span className="hidden md:inline">Add Category</span>
                      <span className="md:hidden">Add</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="grid gap-3">
                {categories
                  .filter(c => selectedCategoriesSectionId ? c.section_id === selectedCategoriesSectionId : true)
                  .map((cat) => (
                  <div key={cat.id} className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: cat.bg_color }}>
                      {cat.icon_url && <img src={cat.icon_url} alt="" className="w-6 h-6 object-contain" />}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm">{cat.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {subcategories.filter(s => s.category_id === cat.id).length} subcategories, {categoryDownloads.filter((download) => download.category_id === cat.id).length} downloads
                      </p>
                    </div>
                    <button onClick={() => { setEditCategory(cat); setEditSubs(subcategories.filter(s => s.category_id === cat.id)); setEditDownloads(categoryDownloads.filter((download) => download.category_id === cat.id)); }} className="p-2 text-muted-foreground hover:text-foreground"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => deleteCategory(cat.id)} className="p-2 text-destructive"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
              {editCategory && (
                <Modal title={editCategory.id ? 'Edit Category' : 'Add Category'} onClose={() => { setEditCategory(null); setEditSubs([]); setEditDownloads([]); }}>
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
                        <button onClick={() => setEditSubs([...editSubs, { id: crypto.randomUUID(), category_id: editCategory.id || '', name: '', link: null, video_url: null, schedule_link: null, show_schedule_in_separate_tab: false, schedule_link_2: null, show_schedule_2_in_separate_tab: false, sort_order: editSubs.length }])} className="text-sm text-primary font-semibold">+ Add</button>
                      </div>
                      {editSubs.map((sub, i) => (
                        <div key={sub.id} className="space-y-2 mb-4 p-3 rounded-lg border border-border bg-muted/30">
                          <div className="flex gap-2">
                            <input placeholder="Name" value={sub.name} onChange={(e) => { const ns = [...editSubs]; ns[i] = { ...ns[i], name: e.target.value }; setEditSubs(ns); }} className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-sm" />
                            <button onClick={() => setEditSubs(editSubs.filter((_, j) => j !== i))} className="text-destructive p-2"><X className="w-4 h-4" /></button>
                          </div>
                          <input placeholder="Link (optional)" value={sub.link || ''} onChange={(e) => { const ns = [...editSubs]; ns[i] = { ...ns[i], link: e.target.value || null }; setEditSubs(ns); }} className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" />
                          <input placeholder="Video URL (optional)" value={sub.video_url || ''} onChange={(e) => { const ns = [...editSubs]; ns[i] = { ...ns[i], video_url: e.target.value || null }; setEditSubs(ns); }} className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" />
                          <input placeholder="Schedule Link (optional)" value={sub.schedule_link || ''} onChange={(e) => { const ns = [...editSubs]; ns[i] = { ...ns[i], schedule_link: e.target.value || null }; setEditSubs(ns); }} className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" />
                          <input placeholder="Schedule Link 2 (optional)" value={sub.schedule_link_2 || ''} onChange={(e) => { const ns = [...editSubs]; ns[i] = { ...ns[i], schedule_link_2: e.target.value || null }; setEditSubs(ns); }} className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" />
                          <label className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Switch
                              checked={sub.show_schedule_in_separate_tab ?? false}
                              onCheckedChange={(checked) => {
                                const ns = [...editSubs];
                                ns[i] = { ...ns[i], show_schedule_in_separate_tab: Boolean(checked) };
                                setEditSubs(ns);
                              }}
                            />
                            <span>Show schedule in separate tab</span>
                          </label>
                          <label className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Switch
                              checked={sub.show_schedule_2_in_separate_tab ?? false}
                              onCheckedChange={(checked) => {
                                const ns = [...editSubs];
                                ns[i] = { ...ns[i], show_schedule_2_in_separate_tab: Boolean(checked) };
                                setEditSubs(ns);
                              }}
                            />
                            <span>Show schedule 2 in separate tab</span>
                          </label>
                        </div>
                      ))}
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium">Overview Downloads</label>
                        <button
                          type="button"
                          onClick={() => {
                            if (editDownloads.length >= 5) return;
                            setEditDownloads([
                              ...editDownloads,
                              { id: crypto.randomUUID(), category_id: editCategory.id || '', file_name: '', file_url: '', file_type: 'file' },
                            ]);
                          }}
                          disabled={editDownloads.length >= 5}
                          className="text-sm text-primary font-semibold disabled:text-muted-foreground"
                        >
                          + Add
                        </button>
                      </div>
                      <p className="mb-3 text-xs text-muted-foreground">Max 5 PDF or DOCX files. Ye category overview me button ke roop me dikhenge.</p>
                      <div className="space-y-3">
                        {editDownloads.map((download, i) => (
                          <div key={download.id || i} className="rounded-xl border border-border p-3">
                            <div className="mb-3 flex items-center justify-between">
                              <span className="text-sm font-medium">Download {i + 1}</span>
                              <button type="button" onClick={() => setEditDownloads(editDownloads.filter((_, index) => index !== i))} className="p-1 text-destructive">
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                            <FileUpload
                              label="Document"
                              value={download.file_url || null}
                              fileName={download.file_name}
                              folder="downloads"
                              onChange={(file) => {
                                const nextDownloads = [...editDownloads];
                                nextDownloads[i] = {
                                  ...nextDownloads[i],
                                  file_name: file.name,
                                  file_url: file.url,
                                  file_type: file.type,
                                };
                                setEditDownloads(nextDownloads);
                              }}
                              onRemove={() => {
                                const nextDownloads = [...editDownloads];
                                nextDownloads[i] = {
                                  ...nextDownloads[i],
                                  file_name: '',
                                  file_url: '',
                                  file_type: 'file',
                                };
                                setEditDownloads(nextDownloads);
                              }}
                            />
                            <input
                              placeholder="Button label"
                              value={download.file_name || ''}
                              onChange={(e) => {
                                const nextDownloads = [...editDownloads];
                                nextDownloads[i] = { ...nextDownloads[i], file_name: e.target.value };
                                setEditDownloads(nextDownloads);
                              }}
                              className="mt-3 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                    <button onClick={saveCategory} className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold">Save</button>
                  </div>
                </Modal>
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
                        className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                          selectedOffersSectionId === section.id
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
                    <button
                      onClick={() => setEditOffer({ heading: '', description: '', image_url: null, link: null, show_border: false })}
                      className="px-3 py-2 md:px-4 md:py-2 rounded-lg bg-primary text-primary-foreground text-xs md:text-sm font-semibold flex items-center justify-center gap-1.5"
                    >
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
                      <button onClick={() => setEditOffer(offer)} className="p-2 text-muted-foreground hover:text-foreground"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => deleteOffer(offer.id)} className="p-2 text-destructive"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              )}
              {editOffer && (
                <Modal title={editOffer.id ? 'Edit Offer' : 'Add Offer'} onClose={() => setEditOffer(null)}>
                  <div className="space-y-4">
                    <ImageCropper label="Offer Image" value={editOffer.image_url || null} onChange={(url) => setEditOffer({ ...editOffer, image_url: url })} folder="offers" previewAspectRatio={16/9} previewLabel="Homepage Preview" />
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Heading</label>
                      <input value={editOffer.heading || ''} onChange={(e) => setEditOffer({ ...editOffer, heading: e.target.value })} className="w-full px-4 py-2.5 rounded-lg border border-input bg-background" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Description</label>
                      <textarea value={editOffer.description || ''} onChange={(e) => setEditOffer({ ...editOffer, description: e.target.value })} className="w-full px-4 py-2.5 rounded-lg border border-input bg-background" rows={3} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Link (optional)</label>
                      <input value={editOffer.link || ''} onChange={(e) => setEditOffer({ ...editOffer, link: e.target.value || null })} className="w-full px-4 py-2.5 rounded-lg border border-input bg-background" />
                    </div>
                    <label className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Switch checked={editOffer.show_border ?? false} onCheckedChange={(checked) => setEditOffer({ ...editOffer, show_border: Boolean(checked) })} />
                      <span>Enable Border</span>
                    </label>
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
                        className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                          selectedAds2SectionId === section.id
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
                    <button onClick={() => setEditAd2({ image_url: null, link: null, show_border: false })} className="px-3 py-2 md:px-4 md:py-2 rounded-lg bg-primary text-primary-foreground text-xs md:text-sm font-semibold flex items-center justify-center gap-1.5">
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
                    <ImageCropper label="Ad Image" value={editAd2.image_url || null} onChange={(url) => setEditAd2({ ...editAd2, image_url: url })} folder="ads" previewAspectRatio={2/1} previewLabel="Desktop Preview (2:1)" />
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Link (optional)</label>
                      <input value={editAd2.link || ''} onChange={(e) => setEditAd2({ ...editAd2, link: e.target.value || null })} className="w-full px-4 py-2.5 rounded-lg border border-input bg-background" />
                    </div>
                    <label className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Switch checked={editAd2.show_border ?? false} onCheckedChange={(checked) => setEditAd2({ ...editAd2, show_border: Boolean(checked) })} />
                      <span>Enable Border</span>
                    </label>
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
                        className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                          selectedAds1SectionId === section.id
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
                    <button onClick={() => setEditAd1({ image_url: null, link: null, show_border: false })} className="px-3 py-2 md:px-4 md:py-2 rounded-lg bg-primary text-primary-foreground text-xs md:text-sm font-semibold flex items-center justify-center gap-1.5">
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
                    <div key={ad.id} className="relative rounded-xl overflow-hidden border border-border aspect-[2/1] bg-muted group">
                      {ad.image_url && <img src={ad.image_url} alt="" className="w-full h-full object-cover" />}
                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
                    <ImageCropper label="Ad Image" value={editAd1.image_url || null} onChange={(url) => setEditAd1({ ...editAd1, image_url: url })} folder="ads" previewAspectRatio={2/1} previewLabel="Desktop Preview (2:1)" />
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Link (optional)</label>
                      <input value={editAd1.link || ''} onChange={(e) => setEditAd1({ ...editAd1, link: e.target.value || null })} className="w-full px-4 py-2.5 rounded-lg border border-input bg-background" />
                    </div>
                    <label className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Switch checked={editAd1.show_border ?? false} onCheckedChange={(checked) => setEditAd1({ ...editAd1, show_border: Boolean(checked) })} />
                      <span>Enable Border</span>
                    </label>
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
                        className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                          selectedAds3SectionId === section.id
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
                    <button onClick={() => setEditAd3({ image_url: null, heading: '', description: '', link: null, show_border: false })} className="px-3 py-2 md:px-4 md:py-2 rounded-lg bg-primary text-primary-foreground text-xs md:text-sm font-semibold flex items-center justify-center gap-1.5">
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
                    <ImageCropper label="Ad Image" value={editAd3.image_url || null} onChange={(url) => setEditAd3({ ...editAd3, image_url: url })} folder="ads" previewAspectRatio={16/9} previewLabel="Desktop Preview (16:9)" />
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Heading (optional)</label>
                      <input value={editAd3.heading || ''} onChange={(e) => setEditAd3({ ...editAd3, heading: e.target.value || null })} className="w-full px-4 py-2.5 rounded-lg border border-input bg-background" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Description (optional)</label>
                      <textarea value={editAd3.description || ''} onChange={(e) => setEditAd3({ ...editAd3, description: e.target.value || null })} className="w-full px-4 py-2.5 rounded-lg border border-input bg-background" rows={3} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Link (optional)</label>
                      <input value={editAd3.link || ''} onChange={(e) => setEditAd3({ ...editAd3, link: e.target.value || null })} className="w-full px-4 py-2.5 rounded-lg border border-input bg-background" />
                    </div>
                    <label className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Switch checked={editAd3.show_border ?? false} onCheckedChange={(checked) => setEditAd3({ ...editAd3, show_border: Boolean(checked) })} />
                      <span>Enable Border</span>
                    </label>
                    <button onClick={saveAd3} className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold">Save</button>
                  </div>
                </Modal>
              )}
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

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-foreground/50 z-50 flex items-center justify-center p-3 md:p-4" onClick={onClose}>
      <div className="bg-card rounded-xl md:rounded-2xl shadow-2xl w-full max-w-sm md:max-w-lg max-h-[90vh] md:max-h-[85vh] overflow-y-auto p-4 md:p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base md:text-lg font-bold truncate pr-2">{title}</h3>
          <button onClick={onClose} className="p-1 flex-shrink-0 text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

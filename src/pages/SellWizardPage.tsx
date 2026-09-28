import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ImagePlus,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react';
import { CATEGORIES, getCategoryBySlug, getCategoryName } from '../data/categories';
import { CITIES, getAreasForCity } from '../data/locations';
import { PriceTrendsModule } from '../components/listing/PriceTrendsModule';
import { InfoTooltip } from '../components/ui/InfoTooltip';
import { useMarketplace } from '../store/MarketplaceContext';
import {
  ContactPreference,
  ItemCondition,
  Listing,
} from '../types/marketplace';
import {
  evaluateListingQuality,
  formatPKR,
} from '../utils/formatters';
import { createStudioGallerySet } from '../utils/studioVisuals';

interface SellWizardPageProps {
  editListingId?: string;
}

const CONDITIONS: { value: ItemCondition; desc: string }[] = [
  {
    value: 'Like New',
    desc: 'Mint condition, barely used, original box and accessories intact.',
  },
  {
    value: 'Excellent',
    desc: 'Lightly used, 100% functional with virtually no visible marks.',
  },
  {
    value: 'Good',
    desc: 'Normal everyday wear, works reliably with all primary functions intact.',
  },
  {
    value: 'Fair',
    desc: 'Noticeable cosmetic wear or minor quirk clearly disclosed in description.',
  },
  {
    value: 'For Parts',
    desc: 'Requires repair or intended for spare components.',
  },
];

const STEPS = [
  { num: 1, label: 'Category' },
  { num: 2, label: 'Photos' },
  { num: 3, label: 'Details' },
  { num: 4, label: 'Price & Location' },
  { num: 5, label: 'Preview' },
  { num: 6, label: 'Publish' },
];

export const SellWizardPage: React.FC<SellWizardPageProps> = ({
  editListingId,
}) => {
  const {
    listings,
    getListingById,
    currentUser,
    createListing,
    updateListing,
    navigate,
  } = useMarketplace();

  const existingListing = editListingId ? getListingById(editListingId) : undefined;

  const [step, setStep] = useState<number>(1);
  const [category, setCategory] = useState<string>(
    existingListing?.category || 'mobiles'
  );
  const [subcategory, setSubcategory] = useState<string>(
    existingListing?.subcategory || 'Smartphones'
  );
  const [images, setImages] = useState<string[]>(
    existingListing?.images || []
  );
  const [title, setTitle] = useState<string>(existingListing?.title || '');
  const [description, setDescription] = useState<string>(
    existingListing?.description || ''
  );
  const [brand, setBrand] = useState<string>(existingListing?.brand || '');
  const [model, setModel] = useState<string>(existingListing?.model || '');
  const [condition, setCondition] = useState<ItemCondition>(
    existingListing?.condition || 'Excellent'
  );
  const [priceInput, setPriceInput] = useState<string>(
    existingListing ? String(existingListing.price) : ''
  );
  const [city, setCity] = useState<string>(
    existingListing?.city || currentUser.city || 'Karachi'
  );
  const [area, setArea] = useState<string>(
    existingListing?.area || currentUser.area || 'PECHS'
  );
  const [contactPreference, setContactPreference] = useState<ContactPreference>(
    existingListing?.contactPreference || 'Messages & Offers'
  );

  const [stepError, setStepError] = useState<string>('');
  const [uploadFeedback, setUploadFeedback] = useState<string>('');
  const [publishedListing, setPublishedListing] = useState<Listing | null>(null);

  const categoryObj = useMemo(() => getCategoryBySlug(category), [category]);
  const cityAreas = useMemo(() => getAreasForCity(city), [city]);

  const numericPrice = Number(priceInput) || 0;

  const qualityReport = useMemo(
    () =>
      evaluateListingQuality({
        title,
        description,
        images,
        condition,
        price: numericPrice,
        city,
        area,
        brand,
      }),
    [title, description, images, condition, numericPrice, city, area, brand]
  );

  // Generate 3 clean studio demo photos matching the selected category/title
  const handleAddDemoPhotoSet = () => {
    const typeMap: Record<
      string,
      Parameters<typeof createStudioGallerySet>[0]['illustrationType']
    > = {
      mobiles: 'smartphone',
      'laptops-computers': 'laptop',
      electronics: 'tv',
      gaming: 'console',
      cameras: 'camera',
      vehicles: 'bicycle',
      furniture: 'desk',
      'home-appliances': 'appliance',
      fashion: 'watch',
      books: 'books',
      'sports-fitness': 'dumbbells',
      other: 'guitar',
    };

    const generated = createStudioGallerySet({
      title: title.trim() || `${getCategoryName(category)} Listing`,
      subtitle: `${brand || getCategoryName(category)} · ${condition} · ${area}, ${city}`,
      accentHex: '#0F5348',
      bgTone: '#F3F4F6',
      illustrationType: typeMap[category] || 'generic',
    });

    setImages((prev) => [...prev, ...generated].slice(0, 6));
    setUploadFeedback('Added 3 studio inspection angles.');
    setStepError('');
  };

  // Real local file upload via FileReader
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadFeedback('');
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) {
        setUploadFeedback(
          `Skipped "${file.name}" — only image files (JPG, PNG, WebP) are supported.`
        );
        return;
      }
      if (file.size > 8 * 1024 * 1024) {
        setUploadFeedback(`Skipped "${file.name}" — file exceeds 8MB limit.`);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setImages((prev) => [...prev, reader.result as string].slice(0, 6));
          setStepError('');
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const moveImage = (idx: number, direction: -1 | 1) => {
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= images.length) return;
    setImages((prev) => {
      const copy = [...prev];
      const temp = copy[idx];
      copy[idx] = copy[targetIdx];
      copy[targetIdx] = temp;
      return copy;
    });
  };

  const removeImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const validateCurrentStep = (): boolean => {
    setStepError('');
    if (step === 1) {
      if (!category) {
        setStepError('Please select a category to continue.');
        return false;
      }
      return true;
    }
    if (step === 2) {
      if (images.length < 1) {
        setStepError(
          'Please upload at least 1 photo or click "Generate 3 Studio Angles" to continue.'
        );
        return false;
      }
      return true;
    }
    if (step === 3) {
      if (title.trim().length < 8) {
        setStepError(
          'Please enter a descriptive title (at least 8 characters, e.g., brand + model).'
        );
        return false;
      }
      if (description.trim().length < 25) {
        setStepError(
          'Please write at least 25 characters describing the item condition and what is included.'
        );
        return false;
      }
      if (!condition) {
        setStepError('Please select an item condition.');
        return false;
      }
      return true;
    }
    if (step === 4) {
      if (!Number.isFinite(numericPrice) || numericPrice < 200) {
        setStepError('Please enter a valid price of at least Rs. 200.');
        return false;
      }
      if (!city || !area) {
        setStepError('Please select both your city and neighborhood area.');
        return false;
      }
      return true;
    }
    return true;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      setStep((prev) => Math.min(6, prev + 1));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    setStepError('');
    setStep((prev) => Math.max(1, prev - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveDraft = () => {
    const finalImages =
      images.length > 0
        ? images
        : createStudioGallerySet({
            title: title.trim() || 'Draft Item',
            subtitle: `${getCategoryName(category)} · ${city}`,
            accentHex: '#0F5348',
            bgTone: '#F3F4F6',
            illustrationType: 'generic',
          });

    if (existingListing) {
      updateListing(existingListing.id, {
        title: title.trim() || 'Untitled Draft',
        description: description.trim() || 'Draft description pending.',
        category,
        subcategory,
        brand: brand.trim() || 'Generic',
        model: model.trim() || 'Standard',
        condition,
        price: numericPrice || 1000,
        city,
        area,
        location: `${area}, ${city}`,
        images: finalImages,
        status: 'draft',
        contactPreference,
      });
    } else {
      createListing({
        title: title.trim() || 'Untitled Draft Listing',
        description: description.trim() || 'Draft description pending.',
        category,
        subcategory,
        brand: brand.trim() || 'Generic',
        model: model.trim() || 'Standard',
        condition,
        price: numericPrice || 1000,
        city,
        area,
        location: `${area}, ${city}`,
        images: finalImages,
        status: 'draft',
        contactPreference,
      });
    }
    navigate('/my-listings');
  };

  const handlePublish = () => {
    if (existingListing) {
      updateListing(existingListing.id, {
        title: title.trim(),
        description: description.trim(),
        category,
        subcategory,
        brand: brand.trim() || getCategoryName(category),
        model: model.trim() || 'Standard',
        condition,
        price: Math.round(numericPrice),
        city,
        area,
        location: `${area}, ${city}`,
        images,
        status: 'active',
        contactPreference,
      });
      const updated = getListingById(existingListing.id);
      if (updated) {
        setPublishedListing({
          ...updated,
          title: title.trim(),
          price: Math.round(numericPrice),
          location: `${area}, ${city}`,
          images,
        });
      }
      setStep(6);
    } else {
      const created = createListing({
        title: title.trim(),
        description: description.trim(),
        category,
        subcategory,
        brand: brand.trim() || getCategoryName(category),
        model: model.trim() || 'Standard',
        condition,
        price: Math.round(numericPrice),
        city,
        area,
        location: `${area}, ${city}`,
        images,
        status: 'active',
        contactPreference,
      });
      setPublishedListing(created);
      setStep(6);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header & Progress Bar */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-[#0F5348]">
              PHIRSE · Give It Another Life.
            </p>
            <h1 className="font-display text-2xl font-bold text-gray-900">
              {existingListing
                ? `Edit Listing (${existingListing.id})`
                : 'Sell a Pre-Owned Item'}
            </h1>
          </div>
          {step < 6 && (
            <button
              type="button"
              onClick={handleSaveDraft}
              className="min-h-[40px] px-4 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-700 self-start sm:self-auto whitespace-nowrap"
            >
              Save as Draft
            </button>
          )}
        </div>

        {/* 6-step progress indicator */}
        <ol
          aria-label="Listing creation progress"
          className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-2"
        >
          {STEPS.map((s) => {
            const isCompleted = step > s.num;
            const isCurrent = step === s.num;
            return (
              <li
                key={s.num}
                className={`p-2.5 rounded-lg border text-xs transition-colors ${
                  isCurrent
                    ? 'border-[#0F5348] bg-[#EBF3F1]/60 font-semibold text-gray-900'
                    : isCompleted
                    ? 'border-emerald-700/30 bg-white text-gray-800'
                    : 'border-gray-200 bg-white text-gray-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="tabular-nums font-semibold">0{s.num}</span>
                  {isCompleted && <Check className="w-3.5 h-3.5 text-[#0F5348]" />}
                </div>
                <p className="mt-1 truncate">{s.label}</p>
              </li>
            );
          })}
        </ol>
      </div>

      {stepError && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs sm:text-sm font-medium text-red-800"
        >
          {stepError}
        </div>
      )}

      {/* STEP 1: CATEGORY */}
      {step === 1 && (
        <div className="bg-white rounded-xl border border-gray-900/10 p-6 space-y-6">
          <div>
            <h2 className="font-display text-lg font-bold text-gray-900">
              Step 1: Choose a Category
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
              Placing your item in the right category helps local buyers find it
              immediately.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {CATEGORIES.map((cat) => {
              const selected = category === cat.slug;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setCategory(cat.slug);
                    setSubcategory(cat.subcategories[0] || '');
                  }}
                  className={`text-left p-4 rounded-xl border transition-colors ${
                    selected
                      ? 'border-[#0F5348] bg-[#EBF3F1]/50'
                      : 'border-gray-200 hover:border-gray-400 bg-white'
                  }`}
                >
                  <p className="text-sm font-bold text-gray-900">{cat.name}</p>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                    {cat.description}
                  </p>
                </button>
              );
            })}
          </div>

          {categoryObj && categoryObj.subcategories.length > 0 && (
            <div className="pt-4 border-t border-gray-900/10 space-y-2">
              <label
                htmlFor="sell-subcategory"
                className="block text-xs font-semibold text-gray-900"
              >
                Subcategory in {categoryObj.name}
              </label>
              <div className="flex flex-wrap gap-2">
                {categoryObj.subcategories.map((sub) => (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => setSubcategory(sub)}
                    className={`px-3.5 py-2 rounded-lg border text-xs font-semibold transition-colors ${
                      subcategory === sub
                        ? 'border-[#0F5348] bg-[#0F5348] text-white'
                        : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* STEP 2: PHOTOS */}
      {step === 2 && (
        <div className="bg-white rounded-xl border border-gray-900/10 p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-bold text-gray-900">
                Step 2: Upload Item Photos
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
                Add at least 2 photos (front view, back/ports, and included box or
                accessories). The first photo is your cover image.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddDemoPhotoSet}
              className="min-h-[40px] px-4 py-2 rounded-lg bg-[#EBF3F1] hover:bg-[#d6e8e4] text-[#0F5348] text-xs font-semibold flex items-center gap-1.5 transition-colors self-start sm:self-auto whitespace-nowrap"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Generate 3 Studio Angles</span>
            </button>
          </div>

          {/* Upload dropzone */}
          <label className="block border-2 border-dashed border-gray-300 hover:border-[#0F5348] rounded-xl p-8 text-center cursor-pointer transition-colors bg-[#F8F9FA]">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileUpload}
              className="sr-only"
            />
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-gray-900">
              Click to select photos from your device
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Supports JPG, PNG, WebP up to 8MB each (up to 6 photos)
            </p>
          </label>

          {uploadFeedback && (
            <p className="text-xs font-medium text-[#0F5348]">{uploadFeedback}</p>
          )}

          {/* Photo Grid with Reorder and Primary Indicator */}
          {images.length > 0 ? (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-gray-700 tabular-nums">
                Uploaded photos ({images.length} / 6) — use arrows to reorder:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {images.map((img, idx) => (
                  <div
                    key={idx}
                    className={`rounded-xl border overflow-hidden bg-gray-50 flex flex-col ${
                      idx === 0
                        ? 'border-[#0F5348] ring-1 ring-[#0F5348]'
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="relative aspect-4/3 bg-gray-200">
                      <img
                        src={img}
                        alt={`Upload preview ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {idx === 0 && (
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-[#0F5348] text-white text-[11px] font-semibold">
                          Primary Cover
                        </span>
                      )}
                    </div>
                    <div className="p-2.5 bg-white flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => moveImage(idx, -1)}
                          aria-label="Move photo left"
                          className="px-2 py-1 rounded border border-gray-200 hover:bg-gray-100 disabled:opacity-40"
                        >
                          ←
                        </button>
                        <button
                          type="button"
                          disabled={idx === images.length - 1}
                          onClick={() => moveImage(idx, 1)}
                          aria-label="Move photo right"
                          className="px-2 py-1 rounded border border-gray-200 hover:bg-gray-100 disabled:opacity-40"
                        >
                          →
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        aria-label={`Remove photo ${idx + 1}`}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-xl bg-gray-50 border border-gray-200 text-center space-y-2">
              <ImagePlus className="w-6 h-6 text-gray-400 mx-auto" />
              <p className="text-xs text-gray-600">
                No photos selected yet. Upload from your device or click{' '}
                <strong>Generate 3 Studio Angles</strong> above for instant demo
                photos.
              </p>
            </div>
          )}
        </div>
      )}

      {/* STEP 3: DETAILS */}
      {step === 3 && (
        <div className="bg-white rounded-xl border border-gray-900/10 p-6 space-y-6">
          <div>
            <h2 className="font-display text-lg font-bold text-gray-900">
              Step 3: Item Details & Condition
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
              Specific titles and honest condition descriptions receive significantly
              faster inquiries.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="sell-title"
                className="block text-xs font-semibold text-gray-900 mb-1"
              >
                Listing Title *
              </label>
              <input
                id="sell-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Apple iPhone 13 128GB Midnight (Official PTA Approved)"
                className="w-full min-h-[42px] rounded-lg border border-gray-300 px-3.5 py-2 text-sm text-gray-900 focus:border-[#0F5348] focus:outline-none"
              />
              <p className="text-[11px] text-gray-500 mt-1">
                Include brand, model, key spec, or PTA status ({title.trim().length} /
                80 characters).
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="sell-brand"
                  className="block text-xs font-semibold text-gray-900 mb-1"
                >
                  Brand
                </label>
                <input
                  id="sell-brand"
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="e.g., Apple, Lenovo, Sony, Chiniot Craft"
                  className="w-full min-h-[42px] rounded-lg border border-gray-300 px-3.5 py-2 text-sm text-gray-900 focus:border-[#0F5348] focus:outline-none"
                />
              </div>
              <div>
                <label
                  htmlFor="sell-model"
                  className="block text-xs font-semibold text-gray-900 mb-1"
                >
                  Model / Edition
                </label>
                <input
                  id="sell-model"
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="e.g., ThinkPad T14 Gen 2 / CFI-1216A"
                  className="w-full min-h-[42px] rounded-lg border border-gray-300 px-3.5 py-2 text-sm text-gray-900 focus:border-[#0F5348] focus:outline-none"
                />
              </div>
            </div>

            {/* Condition selector */}
            <fieldset className="space-y-2">
              <legend className="text-xs font-semibold text-gray-900">
                Condition *
              </legend>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {CONDITIONS.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setCondition(item.value)}
                    className={`text-left p-3.5 rounded-lg border transition-colors ${
                      condition === item.value
                        ? 'border-[#0F5348] bg-[#EBF3F1]/50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <p className="text-sm font-bold text-gray-900">{item.value}</p>
                    <p className="text-xs text-gray-600 mt-0.5">{item.desc}</p>
                  </button>
                ))}
              </div>
            </fieldset>

            <div>
              <label
                htmlFor="sell-description"
                className="block text-xs font-semibold text-gray-900 mb-1"
              >
                Detailed Description *
              </label>
              <textarea
                id="sell-description"
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe how long you have owned the item, battery health or working condition, included accessories/box, and reason for selling..."
                className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 focus:border-[#0F5348] focus:outline-none"
              />
              <p className="text-[11px] text-gray-500 mt-1">
                {description.trim().length} characters (50+ recommended for Strong
                listing quality).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: PRICE + LOCATION */}
      {step === 4 && (
        <div className="bg-white rounded-xl border border-gray-900/10 p-6 space-y-6">
          <div>
            <h2 className="font-display text-lg font-bold text-gray-900">
              Step 4: Price & Neighborhood Location
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
              Set a fair price in PKR and select your neighborhood for local
              inspection.
            </p>
          </div>

          <div className="space-y-5">
            <div>
              <label
                htmlFor="sell-price"
                className="block text-xs font-semibold text-gray-900 mb-1"
              >
                Asking Price (PKR) *
              </label>
              <div className="relative max-w-xs">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500">
                  Rs.
                </span>
                <input
                  id="sell-price"
                  type="number"
                  min="200"
                  step="500"
                  value={priceInput}
                  onChange={(e) => setPriceInput(e.target.value)}
                  placeholder="45000"
                  className="w-full min-h-[44px] pl-11 pr-4 py-2 rounded-lg border border-gray-300 font-price text-base font-bold text-gray-900 tabular-nums focus:border-[#0F5348] focus:outline-none"
                />
              </div>
            </div>

            {/* Interactive Price Trends & Condition Pricing Assistant */}
            <PriceTrendsModule
              categorySlug={category}
              subcategory={subcategory}
              currentPrice={numericPrice}
              currentCondition={condition}
              allListings={listings}
              onSelectSuggestedPrice={(suggested) =>
                setPriceInput(String(suggested))
              }
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label
                  htmlFor="sell-city"
                  className="block text-xs font-semibold text-gray-900 mb-1"
                >
                  City *
                </label>
                <select
                  id="sell-city"
                  value={city}
                  onChange={(e) => {
                    const nextCity = e.target.value;
                    setCity(nextCity);
                    const areas = getAreasForCity(nextCity);
                    setArea(areas[0] || '');
                  }}
                  className="w-full min-h-[42px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-[#0F5348] focus:outline-none"
                >
                  {CITIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="sell-area"
                  className="block text-xs font-semibold text-gray-900 mb-1"
                >
                  Neighborhood Area *
                </label>
                <select
                  id="sell-area"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  className="w-full min-h-[42px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-[#0F5348] focus:outline-none"
                >
                  {cityAreas.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label
                htmlFor="sell-contact-pref"
                className="block text-xs font-semibold text-gray-900 mb-1"
              >
                Contact & Offer Preference
              </label>
              <select
                id="sell-contact-pref"
                value={contactPreference}
                onChange={(e) =>
                  setContactPreference(e.target.value as ContactPreference)
                }
                className="w-full max-w-md min-h-[42px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-[#0F5348] focus:outline-none"
              >
                <option value="Messages & Offers">
                  In-App Messages & Structured Offers
                </option>
                <option value="In-App Messages">
                  In-App Messages Only (Fixed Price)
                </option>
                <option value="Flexible Meetup">
                  Flexible Local Inspection & Meetup
                </option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* STEP 5: PREVIEW + LISTING QUALITY ASSISTANCE */}
      {step === 5 && (
        <div className="space-y-6">
          {/* Deterministic Listing Quality Assistance Card (Section 21) */}
          <div className="bg-white rounded-xl border border-gray-900/10 p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-lg font-bold text-gray-900">
                    Listing Quality: {qualityReport.level}
                  </h2>
                  <InfoTooltip
                    label="Deterministic Listing Quality Score"
                    content="Evaluates 6 completeness criteria: title length, description depth, multi-angle photos, condition selection, realistic PKR pricing, and neighborhood location."
                    align="left"
                  />
                </div>
                <p className="text-xs text-gray-600 mt-0.5">
                  {qualityReport.missingHints.length === 0
                    ? 'Your listing is complete and ready for buyers.'
                    : 'Improve your listing before publishing:'}
                </p>
              </div>
              <span className="font-price text-sm font-bold text-[#0F5348] tabular-nums">
                {qualityReport.score}% Complete
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
              {qualityReport.checks.map((chk) => (
                <div
                  key={chk.key}
                  className="flex items-start gap-2 text-xs text-gray-700"
                >
                  <span
                    className={`font-bold ${
                      chk.passed ? 'text-emerald-700' : 'text-amber-700'
                    }`}
                  >
                    {chk.passed ? '✓' : '•'}
                  </span>
                  <span className={chk.passed ? 'text-gray-800' : 'text-gray-500'}>
                    {chk.label}
                  </span>
                </div>
              ))}
            </div>

            {qualityReport.missingHints.length > 0 && (
              <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 space-y-1 text-xs text-amber-900">
                <p className="font-semibold">Improve your listing:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  {qualityReport.missingHints.map((hint, i) => (
                    <li key={i}>{hint}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Realistic Listing Preview */}
          <div className="bg-white rounded-xl border border-gray-900/10 p-6 space-y-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Listing Preview
            </p>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              <div className="md:col-span-5 aspect-4/3 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                {images[0] && (
                  <img
                    src={images[0]}
                    alt={title}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div className="md:col-span-7 space-y-3">
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <span>{getCategoryName(category)}</span>
                  <span aria-hidden="true">·</span>
                  <span>{subcategory}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-semibold text-gray-800">{condition}</span>
                </div>
                <h3 className="font-display text-xl font-bold text-gray-900">
                  {title}
                </h3>
                <p className="font-price text-2xl font-bold text-gray-900 tabular-nums">
                  {formatPKR(numericPrice)}
                </p>
                <p className="text-xs text-gray-600">
                  Location: <strong>{area}, {city}</strong> · Seller:{' '}
                  <strong>{currentUser.name}</strong>
                </p>
                <p className="text-sm text-gray-700 leading-relaxed pt-2 border-t border-gray-100">
                  {description}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 6: PUBLISHED SUCCESS STATE (Section 23) */}
      {step === 6 && publishedListing && (
        <div className="bg-white rounded-xl border border-gray-900/10 p-8 text-center space-y-6">
          <div className="w-12 h-12 rounded-full bg-[#EBF3F1] text-[#0F5348] flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <p className="font-price text-xs font-semibold text-[#0F5348] tabular-nums">
              Listing ID: {publishedListing.id}
            </p>
            <h2 className="font-display text-2xl font-bold text-gray-900">
              Your listing is now live on PHIRSE
            </h2>
            <p className="text-sm text-gray-600 max-w-md mx-auto">
              Buyers in {publishedListing.location} and across Pakistan can now
              discover, save, and send offers on your item.
            </p>
          </div>

          {/* Compact preview card */}
          <div className="max-w-md mx-auto p-4 rounded-xl bg-[#F8F9FA] border border-gray-900/10 flex items-center gap-4 text-left">
            <img
              src={publishedListing.images[0]}
              alt={publishedListing.title}
              className="w-20 h-16 rounded-lg object-cover shrink-0 bg-gray-200"
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-gray-900 truncate">
                {publishedListing.title}
              </p>
              <p className="font-price text-sm font-semibold text-[#0F5348] tabular-nums mt-0.5">
                {formatPKR(publishedListing.price)}
              </p>
              <p className="text-xs text-gray-500 truncate mt-0.5">
                {publishedListing.location} · {publishedListing.condition}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate(`/listing/${publishedListing.id}`)}
              className="min-h-[44px] px-6 py-2.5 rounded-lg bg-[#0F5348] hover:bg-[#0B3F36] text-white text-sm font-semibold transition-colors"
            >
              View Listing
            </button>
            <button
              type="button"
              onClick={() => navigate('/my-listings')}
              className="min-h-[44px] px-6 py-2.5 rounded-lg bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 text-sm font-semibold transition-colors"
            >
              Manage Listing
            </button>
          </div>
        </div>
      )}

      {/* Wizard Footer Controls */}
      {step < 6 && (
        <div className="flex items-center justify-between pt-4 border-t border-gray-900/10">
          {step > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              className="min-h-[44px] px-5 py-2.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-sm font-semibold text-gray-800 flex items-center gap-2 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => navigate('/browse')}
              className="min-h-[44px] px-4 py-2 text-xs sm:text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              Cancel
            </button>
          )}

          {step < 5 ? (
            <button
              type="button"
              onClick={handleNext}
              className="min-h-[44px] px-6 py-2.5 rounded-lg bg-[#0F5348] hover:bg-[#0B3F36] text-white text-sm font-semibold flex items-center gap-2 transition-colors"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handlePublish}
              className="min-h-[44px] px-7 py-2.5 rounded-lg bg-[#0F5348] hover:bg-[#0B3F36] text-white text-sm font-semibold flex items-center gap-2 transition-colors"
            >
              <Check className="w-4 h-4" />
              <span>
                {existingListing ? 'Save & Publish Changes' : 'Publish Listing'}
              </span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

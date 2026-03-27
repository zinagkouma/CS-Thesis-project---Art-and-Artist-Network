import React, {useEffect, useState} from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, useParams } from "react-router-dom";

import "./newEvent.css"; 



type Role = 'User' | 'Artist' | 'Admin'; 


const CATEGORY_OPT = [
 "Concert", "Play", "Exhibition", "Performance",
 "Workshop", "Talk/Seminar", "Festival"

] as const; 

const TAGS_OPT = [
  "painting","sculpture","photography","digital-art","music",
  "theatre","dance","workshop","kids","free-entry","outdoor",
  "charity","networking"
]

const CITIES_OPT = [
  "Athens", "Piraeus","Thessaloniki", "Patra", "Heraklion", "Chania",
  "Larissa", "Volos", "Ioannina", "Rhodes"
]




type Form = {
    title: string; 
    description: string;
    category: string;
    tags: string[];                 
    coverImageURL: string;
    gallery: string;  

    coverFile: File | null ;    //Upload from device
    galleryFiles: File[]; 
    
    startDate: string; 
    endDate: string; 
    startTime: string;  
    venueName: string; 
    city: string; 
    address: string;


    isFree: boolean; 
    price: string; 
     
};


const initialForm: Form = {
  title: "",
  description: "",
  category: "",
  tags: [],
  coverImageURL: "",
  gallery: "",

  coverFile: null,
  galleryFiles: [],


  startDate: "",
  endDate: "",
  startTime: "",
  venueName: "",
  city: "",
  address: "",


  isFree: true,
  price: "",
  
};

 

const isUrl = (s: string) => {
  try {new URL(s); return true;} catch {return false;}
};


const NewEvent: React.FC = () => {
   const { authHeader } = useAuth();
   const Navigate = useNavigate(); 

   const {id} = useParams(); 
   const isEditMode = !!id; 

   const [isFree, setIsFree] = useState<boolean>(true);
   const [isRange, setIsRange] = useState<boolean>(false);

   const [price, setPrice] = useState<string>("");      
   const [priceMin, setPriceMin] = useState<string>("");
   const [priceMax, setPriceMax] = useState<string>("");

   const [form, setForm] = useState<Form>(initialForm);
   const [submitting, setSubmitting] = useState<"draft" | "published" | null>(null); 
   const [error, setError] = useState<string | null>(null); 

   const [coverPreview, setCoverPreview] = useState<string | null>(null);
   const [galleryPreview, setGalleryPreview] = useState<string[]>([]);

  
   //Search address autocomplete
   const [suggestions, setSuggestions] = useState<any[]>([]);
   const [showDropdown, setShowDropdown] = useState(false);
   const [coords, setCoords] = useState<[number, number] | null>(null);



   const checks = {
    titleOk: !!form.title.trim(),
    descOk: !!form.description.trim(),
    categoryOk: !!form.category.trim(),

    coverOk: (form.coverFile instanceof File) || isUrl(form.coverImageURL), // allow either a file or a valid URL
    startDateOk: !!form.startDate,
    startTimeOk: !!form.startTime,
    venueNameOk: !!form.venueName,
    cityOk: !!form.city.trim(),
    addressOk: !!form.address.trim(),

    priceOk: form.isFree ? true : (
      isRange
             ? (!!priceMin && !!priceMax)
             : !! price
    ), 
    
    locationOk: !!coords
   };

   {/*Separate validations for Publish or Draft*/}
   const canDraft = checks.titleOk && checks.categoryOk;  //Needs ONLY title and category 
   const canPublish = Object.values(checks).every(Boolean);

   
   useEffect(() => {
    if (isFree) {
      setIsRange(false);
      setPrice("");
      setPriceMin("");
      setPriceMax("");
    }
   }, [isFree]);


   //Check da shit 
      console.log({
       canDraft,
       canPublish, 
       checks,
       hasCoverFile: form.coverFile instanceof File,
       hasCoverUrl: isUrl(form.coverImageURL),
     });


   const update = (k: keyof Form, v: string | boolean) =>
     setForm((f) => ({...f, [k]: v}));


   const MAX_TAGS = 3;

   const addTag = (tag: string) =>
    setForm(f => {
     if (f.tags.includes(tag)) return f;
     if (f.tags.length >= MAX_TAGS) return f;
     return { ...f, tags: [...f.tags, tag] };
  });

   const removeTag = (tag: string) =>
  setForm(f => ({ ...f, tags: f.tags.filter(t => t !== tag) }))


  //Real time address search
  useEffect(() => {
    if (form.address.length < 3 || !form.city) {
      setSuggestions([]);
      return; 
    }

    const fetchSuggestions = async () => {
      try {
       const query = `${form.address}, ${form.city}, Greece`;
       const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`;
       
       const res = await fetch (url, {
         headers: {"User-Agent": "EventFinder/1.0"}
       });

       const data = await res.json(); 
       setSuggestions(data); 
       setShowDropdown(true);

      } catch (err) {
        console.error("Autocomplete fetch failed", err);
      }
    };

     const timer = setTimeout(fetchSuggestions, 500); 
     return () => clearTimeout(timer);

  }, [form.address, form.city]); 



  const onCoverFile = (file?: File) =>
    setForm(f => ({...f, coverFile: file || null}));

  const onGalleryFiles = (files: FileList | null) =>
    setForm(f => ({ ...f, galleryFiles: files ? Array.from(files) : []}));

  
  //Build the preview whether its file or URL 
  useEffect(() => {
    const tempUrls: string[] = [];

    {/*Cover*/}
    if (form.coverFile) {
      const url = URL.createObjectURL(form.coverFile);
      setCoverPreview(url);
      tempUrls.push(url);
    } else if (isUrl(form.coverImageURL)){
       setCoverPreview(form.coverImageURL);
    } else {
      setCoverPreview(null);
    }


    {/*Gallery photos*/}
    const gp: string[] = []; 
 
    if (form.galleryFiles?.length) {
      form.galleryFiles.slice(0,5).forEach(f => {
        const url = URL.createObjectURL(f);
        gp.push(url);
        tempUrls.push(url);
       });
    }

    if (form.gallery) {
      form.gallery
          .split(',')
          .map(s => s.trim())
          .filter(Boolean)
          .forEach(url => {if (isUrl(url)) gp.push(url); });
    }
    setGalleryPreview(gp);

    return () => {tempUrls.forEach(URL.revokeObjectURL); };
  }, [form.coverFile, form.coverImageURL, form.galleryFiles, form.gallery]);




  async function uploadImages(): Promise<{coverUrl: string; galleryUrls:string[]}> {
     const galleryLimit = 5; 
     const toUpload = new FormData();

     if (form.coverFile) toUpload.append("cover", form.coverFile); 
     if (form.galleryFiles.length) {
      form.galleryFiles.slice(0, galleryLimit).forEach((file) => toUpload.append("gallery", file));
     }

     {/*If no files selected, use URL fields*/}
     if ([...toUpload.keys()].length === 0 ){
       return {
        coverUrl: form.coverImageURL,
        galleryUrls: form.gallery 
         ? form.gallery.split(',').map(s => s.trim()).filter(Boolean)
         : []
        };
     }

     const res = await fetch("http://localhost:5000/api/uploads/images", {
       method: "POST",
       headers: {...authHeader()},
       body: toUpload
     });

     if (!res.ok){
       throw new Error(await res.text() || "Upload failed!");
     }
     
     const data = await res.json() as {coverUrl: string; galleryUrls?: string[]};
     const urlCSV = form.gallery
       ? form.gallery.split(',').map(s => s.trim()).filter(Boolean)
       : [];

     return{
      coverUrl: data.coverUrl || form.coverImageURL,
      galleryUrls: [...(data.galleryUrls || []), ...urlCSV]
     };
   }



   async function submit(status: "draft" | "published"){
      if (status === "draft" && !canDraft) return; 
      if (status === "published" && !canPublish) {
        if (!coords) setError("You must verify the address before uploading");
        return; 
      }

      setSubmitting(status); 
      setError(null);

      const { coverUrl, galleryUrls } = await uploadImages();


      const payload : any = {
        title: form.title.trim(),
        description: form.description.trim(), 
        category: form.category.trim(),
        tags: form.tags
            
            .map((t) => t.trim())
            .filter(Boolean),
         
        coverImageURL: coverUrl,
        gallery: galleryUrls,

        startDate: form.startDate,
        endDate: form.endDate || undefined,
        startTime: form.startTime,
        venueName: form.venueName || undefined,
        city: form.city.trim(),
        address: form.address.trim(),

        isFree: isFree,
        
        status
      };

      if (coords) {
        payload.location = {type: "Point", coordinates: coords}; 
      }
 
      //Price logic 
      if (isFree) {
        payload.price = undefined; 
        payload.priceMin = undefined; 
        payload. priceMax = undefined; 

      } else if (isRange) {
        payload.price = undefined; 
        payload.priceMin = priceMin !== "" ? Number(priceMin) : undefined;
        payload.priceMax = priceMax !== "" ? Number(priceMax) : undefined;

      } else {
        payload.price = price !== "" ? Number(price) : undefined;
   
      }


      

      {/*Choose method and URL according to event status*/}
      const method = isEditMode ? 'PUT' : 'POST';
      const url = isEditMode 
           ? `http://localhost:5000/api/events/${id}`
           : "http://localhost:5000/api/events";


      try {
        const res = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify(payload),
      });

      if (!res.ok){
        const msg = await res.text();
        throw new Error(msg || `Create failed (${res.status})`);
      }

    //Navigate to Events on success   
    Navigate('/artist/events');

    //Redirect to Drafts section when draft is saved 
    if (status === "draft") {
      Navigate('/artist/events')
    }


   } catch (e: any) {
     setError(e.message || "Failed to create event");
   } finally {
    setSubmitting(null);
   }
} 



{/*Load data if in Edit mode*/}
useEffect(() => {
  if (!isEditMode) return; 

  const fetchDraft = async () => {
    try {
      const res = await fetch (`http://localhost:5000/api/events/${id}`, {
        headers: authHeader()
      });

      if (!res.ok) throw new Error("Could not load draft");

      const data = await res.json();

      {/*Map the Backend data back to the form state*/}
      setForm({
        title: data.title || "",
        description: data.description || "",
        category: data.category || "",
        tags: data.tags || [],
        coverImageURL: data.coverImageURL || "",
        gallery: (data.gallery || []).join(', '), // Convert array to string
            
        // Files stay null initially 
        coverFile: null, 
        galleryFiles: [],

        // Format dates for input type="date" (YYYY-MM-DD)
        startDate: data.startDate ? data.startDate.split('T')[0] : "",
        endDate: data.endDate ? data.endDate.split('T')[0] : "",
        startTime: data.startTime || "",
            
        venueName: data.venueName || "",
        city: data.city || "",
        address: data.address || "",


        isFree: data.isFree,
        price: data.price?.toString() || "",
         
      });

      {/*Set UI toggles*/}
      setIsFree(data.isFree);
      if (data.coverImageURL) setCoverPreview(data.coverImageURL); 
      if (data.gallery?.length) setGalleryPreview(data.gallery); 
      if (data.location?.coordinates) setCoords(data.location.coordinates);

    } catch (err) {
       console.error(err);
       setError("Failed to load draft data");
    }
  };

  fetchDraft()
  },[id]);



   return (
     <div className="eventNew">
       <div className="eventNew_header">
         <h1>{isEditMode ? "Edit Event" : "Create Event"}</h1>

         <div className="eventNew_actions">
           <button
            className="eventNew_btn"
            type="button"         //Is button because we want to prevent default trigger for submit 
            disabled={!canDraft|| submitting !== null}
            onClick={() => submit("draft")}
            title="Save as draft"
           >
             {submitting === "draft" ? "Saving…" : "Save Draft"}
           </button>

           <button
            className="eventNew_btn eventNew_btn--primary"
            disabled={!canPublish || submitting !== null}
            onClick={() => submit("published")}
            title="Publish Event"
           >
             {submitting === "published" ? "Publishing…" : "Publish"}
           </button>
         </div>
       </div>

       {error && <div className="eventNew_error">⚠️ {error}</div>} 

       <form 
        className="eventNew_form"
        onSubmit={(e) => {
          e.preventDefault();
          
          if (canPublish) {
            submit("published");
          } else if (canDraft) {
            submit("draft");
          } 
        }}
       >

        {/*Left Column*/}
        <section className="eventNew_col">
          <label>
           <span>Title *</span>
           <input 
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            required
            />
          </label>

          <label>
           <span>Description *</span>
           <textarea
            rows={8}
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            required
           />
          </label>

        <div className="eventNew_row">
         <label className="cat_label">
          <span>Category *</span>
           <select 
            value={form.category}
            onChange={(e) => update("category", e.target.value)}
            className="eventNew_select"
            required
           >
             <option value="" disabled>Event Category</option>

             {CATEGORY_OPT.map(opt => (
               <option key={opt} value={opt}>{opt}</option>
             ))}
           </select>
         </label>

         <label>
          <div className="eventNew_tags">
           <span>Tags</span>
           <div className="tags_wrapper">
            <select 
             className="eventNew_select"
             onChange={(e) => {if (e.target.value){addTag(e.target.value); e.target.value = '';}} }
             defaultValue=''
             disabled={form.tags.length >= MAX_TAGS}
            >
              <option value='' disabled>
                {form.tags.length >= MAX_TAGS ? "Max 3 tags reached" : "Add Tag"}
              </option>

              {TAGS_OPT
               .filter(opt => !form.tags.includes(opt))
               .map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
            </div>

            {/*Chips*/}
            <div className="eventNew_chips">
              {form.tags.map(tag => (
                <span key={tag} className="chip">
                  <span className="chipLabel">{tag}</span>
                  <button
                   type="button"
                   className="chipRemove"
                   onClick={() => removeTag(tag)}
                   aria-label={`remove ${tag}`}
                   title="Remove"
                  >
                    x
                  </button>
                </span>               
              ))}

            </div>
             
          </div>
         </label>
        </div>


        <label>
         <span>Cover Image *</span>

         {/*Upload from PC*/}
         <div className="uploadImg"> 
          <input 
           type="file"
           accept="image/*"
           onChange={(e) => onCoverFile(e.target.files?.[0])}
          /> 
         </div>  

         {/*Use image URL (optional)*/}   
         <input 
          className="urlInput"
          placeholder="or paste image URL here"
          value={form.coverImageURL}
          onChange={(e) => update("coverImageURL", e.target.value)}
         />


         {/*Unified preview*/}
          {coverPreview && (
            <div className="imgPreview">
              <img 
               src={coverPreview}
               alt="cover preview"
               onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
              />

            </div>
          )}
        </label>

        
        <label>
          <span>Gallery</span>
          
          {/*Upload from PC (multiple)*/}
          <div className="uploadImg">
            <input 
             type="file"
             accept="image/*"
             onChange={(e) => onGalleryFiles(e.target.files)}
             multiple
            />
          </div>

           {/*Paste URLs*/}
           <input 
            className="urlInput"
            placeholder="or paste image URLs (comma-sep)"
            value={form.gallery}
            onChange={(e) => update("gallery", e.target.value)}
           />

    
          {/*Unified preview*/}
           {galleryPreview.length > 0 && (
             <div className="thumbs">
              {galleryPreview.map((src, i) => 
                <img 
                 key={`${src}-${i}`}
                 src={src}
                 alt={`gallery ${i}`}
                 onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                />           
              )}

             </div>
           )}         
        </label>
      </section>


      {/*Right Column*/}
      <section className="eventNew_col">
        <div className="eventNew_row">

          <label>
            <span>Start Date *</span>
            <input 
             type="date"
             value={form.startDate}
             onChange={(e) => update("startDate", e.target.value)}
             required
            />
          </label>

          <label>
            <span>End Date</span>
            <input 
             type="date"
             value={form.endDate}
             onChange={(e) => update("endDate", e.target.value)}
            />
          </label>
        </div>

        <div className="eventNew_row">
         <label>
          <span>Start Time *</span>
          <input
           type="time"
           value={form.startTime}
           onChange={(e) => update("startTime", e.target.value)}
           required
          />
         </label>
        </div>

        <label>
          <span>Venue Name *</span>
          <input
           value={form.venueName}
           onChange={(e) => update("venueName", e.target.value)}
           placeholder="e.g, Katrakeio Theater"
           required
          />
        </label>

        <div className="eventNew_row">
          <label>
            <span>City *</span>
            <select
             value={form.city}
             onChange={(e) => update("city", e.target.value)}
             className="eventNew_select"
             required
            >

              <option value="" disabled>Select City</option>     

              {CITIES_OPT.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}       
            </select>
          </label>

          <label>
            <span>Address *</span>
            <input
             value={form.address}
             onChange={(e) => update("address", e.target.value)}
             onFocus={() => setShowDropdown(true)}
             placeholder="Search address.."
             required
            />

            {showDropdown && suggestions.length > 0 && (
              <ul className="address_dropdown">
                {suggestions.map((s, i) => (
                 <li key={i} onClick={() =>{
                   
                   setCoords([parseFloat(s.lon), parseFloat(s.lat)]);
                   setSuggestions([]); 
                   setShowDropdown(false);  
                 }}>
                   {s.display_name}
                 </li> 
                ))}
              </ul>
            )}
          </label>
        </div>

        
       
        <fieldset className="eventNew_fieldset">
          <legend>Pricing</legend>
          <div className="tickets">

           <div className="tickets_row">
            <label className="tickets_check">
              <span>Free Event</span>
              <input
               type="checkbox"
               checked={isFree}
               onChange={(e) => setIsFree(e.target.checked)}              
              />
            </label>

            <label className="tickets_check">
              <span>Range</span>
              <input
               type="checkbox"
               checked={isRange}
               onChange={(e) => setIsRange(e.target.checked)}
               disabled={isFree}
              />
            </label>
           </div>

      
         <div className="price-wrapper">

            {/*Single price*/}
             {!isRange && (
              <div className="single_price">
                <label>Price: </label>
                <input
                 type="number"
                 className="price_input"
                 min={0}
                 step={0.5}
                 placeholder="-"
                 value={price}
                 disabled={isFree}
                 onChange={(e) => setPrice(e.target.value)}
                />
                <span>€</span>
              </div>
             )}

             {/*Range price*/}
              {isRange && (
                <div className="range_price" aria-disabled={isFree}>
                  <span>Price: </span> 
                  <input
                   type="number"
                   className="price_input"
                   min={0}
                   step={0.5}
                   placeholder="min"
                   value={priceMin}
                   disabled={isFree}
                   onChange={(e) => setPriceMin(e.target.value)}
                  />
                  
                

                <div className="to-sep">to</div>

                <div className="range_price-input">
                  <input 
                   type="number"
                   className="price_input"
                   min={priceMin ? Number(priceMin) + 1 : 0}
                   step={0.5}
                   placeholder="max"
                   value={priceMax}
                   onChange={(e) => setPriceMax(e.target.value)}                
                  />
                 <span>€</span>
                </div>
              </div>         
            )}
          </div> 

                
          
         </div>
        </fieldset>
      </section>

      </form>
     </div>
   )
}

export default NewEvent; 

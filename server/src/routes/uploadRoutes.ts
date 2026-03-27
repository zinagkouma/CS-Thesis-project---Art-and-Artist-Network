import {Router, Request, Response, NextFunction} from "express";
import multer from "multer";
import fs from "fs"; 
import path from "path";



const router = Router();

const uploadDir = path.join(process.cwd(), 'uploads');
export {uploadDir};

//Make sure the folder exists 
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, {recursive: true});
}

const storage = multer.diskStorage({
  destination:(_req, _file, cb) => cb(null, uploadDir),
  filename:(_req, file, cb) => {
    const id = Math.random().toString(36).slice(2);
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}_${id}${ext}`);
  }
});


export const upload = multer ({
  storage,
  limits: {fileSize: 10 * 1024 * 1024}, //10Mb per image 
  fileFilter: (_req, file, cb) => {
   if (/^image\/(png|jpe?g|webp)$/.test(file.mimetype)) cb(null, true); //Only .png, .jpeg and .webp allowed 
   else cb(new Error("Only image files allowed!"));
  },
});

router .post(
  "/images",
   upload.fields([{name:"cover", maxCount:1}, {name:"gallery", maxCount:5}]),
   (req: Request, res: Response, next: NextFunction) => {
      try{
        const cover = (req.files as any)?.cover?.[0];
        const gallery = (req.files as any)?.gallery || []; 
        
        const base = `${req.protocol}://${req.get("host")}`;
        const coverUrl = cover ? `${base}/uploads/${cover.filename}`: undefined; 
        const galleryUrls = gallery.map ((f: any) => `${base}/uploads/${f.filename}`);
        
        res.json({coverUrl, galleryUrls});
      } catch(err) {
        next(err); 
      }
   }
);

export default router;



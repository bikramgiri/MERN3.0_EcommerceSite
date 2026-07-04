import { Request } from 'express'
import multer from 'multer'

// *For multer Storage Configuration
// const storage = multer.diskStorage({
//   destination: function (req: Request, file: Express.Multer.File, cb: any) {
//     cb(null, './src/storage')
//   },
//   filename: function (req: Request, file: Express.Multer.File, cb: any) {
//     cb(null, `${Date.now()}-${file.originalname}`)
//   }
// })

// const upload = multer({
//   storage,
//   limits: {
//     fileSize: 10 * 1024 * 1024 
//   },
//   fileFilter: function (req: Request, file: Express.Multer.File, cb: any) {
//     const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg']
//     if (!allowedTypes.includes(file.mimetype)) {
//       return cb(new Error('File type is not supported. Only JPEG and PNG are allowed.'))
//     }
//     cb(null, true)
//   }
// })


// *For cloudinary storage configuration
const storage = multer.memoryStorage() // Store files in memory for direct upload to Cloudinary

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Limit file size to 10MB
  fileFilter: (req: Request, file: Express.Multer.File, cb: any) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg']
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('File type is not supported. Only JPEG and PNG are allowed.'))
    }
    cb(null, true)
  }
})

export { upload }

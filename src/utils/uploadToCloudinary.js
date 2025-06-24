export const uploadToCloudinary = async (file) => {
  const data = new FormData();
  data.append('file', file);
  data.append('upload_preset', 'profilePictures'); // 🔁 Your preset name
  data.append('cloud_name', 'dyfksujec');          // 🔁 Your Cloudinary cloud name

  const res = await fetch('https://api.cloudinary.com/v1_1/dyfksujec/image/upload', {
    method: 'POST',
    body: data
  });

  const result = await res.json();

  if (!result.secure_url) {
    throw new Error('Failed to upload image');
  }

  return result.secure_url; // ✅ This is your photoURL
};

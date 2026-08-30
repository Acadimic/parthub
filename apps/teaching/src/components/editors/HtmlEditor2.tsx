// import dynamic from 'next/dynamic';
// import { useEffect, useState } from 'react';
// import 'react-quill-new/dist/quill.snow.css';

// // Dynamically import ReactQuill to avoid SSR issues
// const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

// type HtmlEditorProps = {
//   initialContent?: string;
//   onChange: (html: string) => void;
// };

// export function HtmlEditor2({ initialContent = '', onChange }: HtmlEditorProps) {
//   const [isClient, setIsClient] = useState(false);

//   useEffect(() => {
//     setIsClient(true); // Ensures the component only renders on the client side
//   }, []);

//   const handleChange = (html: string) => {
//     onChange(html);
//   };

//   if (!isClient) return null; // Prevents server-side rendering issues

//   return (
//     <div className="text-sm w-full text-gray-500 resize-none -mt-1.5">
//       <ReactQuill
//         theme="snow"
//         value={initialContent || ''}
//         placeholder="Editor"
//         onChange={(value: string) => handleChange(value)}
//       />
//     </div>
//   );
// }

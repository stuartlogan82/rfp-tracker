import { UploadDemo } from '@/components/UploadDemo';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          RFP Deadline Tracker
        </h1>
        <p className="text-gray-600 mb-8">
          Upload RFP documents to automatically extract deadline dates
        </p>
        <UploadDemo />
      </div>
    </div>
  );
}

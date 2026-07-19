export default function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'h-5 w-5', md: 'h-8 w-8', lg: 'h-12 w-12' };
  return (
    <div className="flex items-center justify-center py-8">
      <div className={`${sizes[size]} rounded-full border-2 border-gray-200 border-t-brand-600 animate-spin`}></div>
    </div>
  );
}

const BrandLogo = ({ subtitle, className = 'text-lg' }) => (
    <span className="inline-flex flex-col leading-tight">
        <span className={`font-extrabold tracking-tight ${className}`}>NexGym</span>
        {subtitle && <span className="text-xs font-normal capitalize opacity-60">{subtitle}</span>}
    </span>
);

export default BrandLogo;

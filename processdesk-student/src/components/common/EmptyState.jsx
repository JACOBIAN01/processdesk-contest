export default function EmptyState({ children = 'No processes found.' }) {
  return <div className="empty">{children}</div>;
}

import { Package, CheckCircle, Truck, XCircle, Clock, CalendarCheck, FilePlus2 } from 'lucide-react';

const StatusBadge = ({ status }) => {
  const getStatusInfo = (status) => {
    switch (status) {
      case 'Livrée':
        return {
          text: 'Livrée',
          icon: CheckCircle,
          color: '#10B981',
          bgColor: '#D1FAE5',
          textColor: '#065F46'
        };
      case 'En cours':
        return {
          text: 'En cours',
          icon: Clock,
          color: '#F59E0B',
          bgColor: '#FEF3C7',
          textColor: '#92400E'
        };
      case 'Annulée':
        return {
          text: 'Annulée',
          icon: XCircle,
          color: '#EF4444',
          bgColor: '#FEE2E2',
          textColor: '#991B1B'
        };
      case 'Confirmée':
        return {
          text: 'Confirmée',
          icon: CalendarCheck,
          color: '#3B82F6',
          bgColor: '#DBEAFE',
          textColor: '#1E40AF'
        };
      case 'Planifiée':
        return {
          text: 'Planifiée',
          icon: Truck,
          color: '#4DAEBD',
          bgColor: '#D1FAFA',
          textColor: '#0F766E'
        };
      case 'Nouvelle':
        return {
          text: 'Nouvelle',
          icon: FilePlus2,
          color: '#A855F7',
          bgColor: '#F3E8FF',
          textColor: '#6B21A8'
        };
      default:
        return {
          text: 'Inconnu',
          icon: Package,
          color: '#6B7280',
          bgColor: '#F3F4F6',
          textColor: '#374151'
        };
    }
  };

  const statusInfo = getStatusInfo(status);
  const StatusIcon = statusInfo.icon;

  return (
    <div
      className="flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium"
      style={{
        backgroundColor: statusInfo.bgColor,
        color: statusInfo.textColor
      }}
    >
      <StatusIcon size={16} />
      <span>{statusInfo.text}</span>
    </div>
  );
};

export default StatusBadge;

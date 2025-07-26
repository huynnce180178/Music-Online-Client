import { useTranslation } from 'react-i18next';
import AdminComments from './AdminComments';

export default function AdminRejectedComments() {
  const { t } = useTranslation();
  return <AdminComments statusDefault="REJECTED" statusLabel={t('admin_comments.status_rejected')} />;
} 
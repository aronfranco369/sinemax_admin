'use client';
import { useParams } from 'next/navigation';
import MediaForm from '@/components/media-form';

export default function EditPage() {
  const { id } = useParams();
  return <MediaForm mediaId={id} />;
}

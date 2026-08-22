import SummaryGenerator from '@/components/SummaryGenerator'

export default function MeetSummaryPage({ params }: { params: { id: string } }) {
    return <SummaryGenerator meetId={params.id} />
}

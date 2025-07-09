import { MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useIntercom } from '@/hooks/useIntercom'

export const IntercomChat = () => {
  const { showMessenger } = useIntercom()

  const handleChatClick = () => {
    showMessenger()
  }

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <Button
        onClick={handleChatClick}
        size="lg"
        className="rounded-full h-14 w-14 bg-primary hover:bg-primary/90 shadow-lg"
        aria-label="Open chat support"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    </div>
  )
}
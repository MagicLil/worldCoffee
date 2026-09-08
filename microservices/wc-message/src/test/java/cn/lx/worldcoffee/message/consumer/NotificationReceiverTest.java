package cn.lx.worldcoffee.message.consumer;

import cn.lx.worldcoffee.message.component.SseEmitterManager;
import org.junit.jupiter.api.Test;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;

class NotificationReceiverTest {

    private final SseEmitterManager sseEmitterManager = mock(SseEmitterManager.class);
    private final NotificationReceiver receiver = new NotificationReceiver(sseEmitterManager);

    @Test
    void shouldForwardStructuredChatEventAndPreserveDelimiterInContent() {
        receiver.handleChatMessage("12|||34|||first|||second");

        verify(sseEmitterManager).sendChatMessage("34", 12L, "first|||second");
    }

    @Test
    void shouldIgnoreMalformedChatMessage() {
        receiver.handleChatMessage("not-a-chat-message");

        verifyNoInteractions(sseEmitterManager);
    }
}

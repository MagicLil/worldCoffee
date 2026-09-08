package cn.lx.worldcoffee.message.consumer;

import cn.lx.worldcoffee.message.component.SseEmitterManager;
import lombok.RequiredArgsConstructor;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class NotificationReceiver {

    private final SseEmitterManager sseEmitterManager;

    @RabbitListener(queues = "notification.queue")
    public void handleNotification(String message) {
        // message格式: "userId:type"
        String[] parts = message.split(":");
        if (parts.length == 2) {
            String userId = parts[0];
            sseEmitterManager.sendNotification(userId, message);
        }
    }

    @RabbitListener(queues = "chat.queue.default")
    public void handleChatMessage(String message) {
        // 消息格式: "fromId|||toId|||content"
        String[] parts = message.split("\\|\\|\\|", 3);
        if (parts.length == 3) {
            try {
                Long fromId = Long.valueOf(parts[0]);
                String toId = parts[1];
                sseEmitterManager.sendChatMessage(toId, fromId, parts[2]);
            } catch (NumberFormatException ignored) {
                // Ignore malformed legacy messages instead of terminating the listener.
            }
        }
    }
}

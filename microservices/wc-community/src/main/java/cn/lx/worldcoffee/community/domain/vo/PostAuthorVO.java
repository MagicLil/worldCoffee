package cn.lx.worldcoffee.community.domain.vo;

import lombok.Builder;
import lombok.Data;

/**
 * Post author data exposed as a nested object for web and mini-program feeds.
 *
 * <p>The legacy flat {@code userId}, {@code username}, and {@code avatar}
 * fields remain on post VOs for backward compatibility.</p>
 */
@Data
@Builder
public class PostAuthorVO {
    private Long id;
    private String username;
    private String nickname;
    private String avatar;
}

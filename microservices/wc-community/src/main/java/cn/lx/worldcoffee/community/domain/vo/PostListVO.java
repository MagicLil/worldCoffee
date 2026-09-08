package cn.lx.worldcoffee.community.domain.vo;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class PostListVO {
    private Long id;
    private Long userId;
    private String username;
    private String avatar;
    private String title;
    private String content;
    private List<String> images;
    private String noteType;
    private String videoUrl;
    private String coverUrl;
    private Integer videoDuration;
    private String coffeeName;
    private String coffeeBrand;
    private String location;
    private List<String> topics;
    private List<Long> productIds;
    private Integer likeCount;
    private Integer commentCount;
    private Integer favoriteCount;
    private Boolean likedByMe;
    private Boolean favoritedByMe;
    private LocalDateTime createTime;

    /**
     * Canonical nested author shape used by the current PC and mobile feeds.
     * Flat fields above are retained for existing callers.
     */
    public PostAuthorVO getAuthor() {
        return PostAuthorVO.builder()
                .id(userId)
                .username(username)
                .nickname(username)
                .avatar(avatar)
                .build();
    }
}

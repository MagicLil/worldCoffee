package cn.lx.worldcoffee.community.domain.vo;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class PostListVOTest {

    @Test
    void shouldExposeNestedAuthorForCurrentFeedClients() {
        PostListVO post = PostListVO.builder()
                .userId(7L)
                .username("咖啡爱好者")
                .avatar("/uploads/avatar.png")
                .build();

        PostAuthorVO author = post.getAuthor();
        assertThat(author.getId()).isEqualTo(7L);
        assertThat(author.getUsername()).isEqualTo("咖啡爱好者");
        assertThat(author.getNickname()).isEqualTo("咖啡爱好者");
        assertThat(author.getAvatar()).isEqualTo("/uploads/avatar.png");
    }
}

import { computed, defineComponent, h, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

import ArticleItem from "@theme-hope/modules/blog/components/ArticleItem.js";
import Pagination from "@theme-hope/modules/blog/components/Pagination.js";
import DropTransition from "@theme-hope/components/transitions/DropTransition.js";
import { EmptyIcon } from "@theme-hope/modules/blog/components/icons/index.js";
import { useBlogOptions } from "@theme-hope/modules/blog/composables/index.js";

import type { PropType, VNode } from "vue";
import type { ArticleInfo } from "../../../../shared/index.js";

import "../styles/article-list.scss";

declare const SUPPORT_PAGEVIEW: boolean;

export default defineComponent({
  name: "ArticleList",

  props: {
    items: {
      type: Array as PropType<{ path: string; info: ArticleInfo }[]>,
      default: () => [],
    },
  },

  setup(props) {
    const route = useRoute();
    const router = useRouter();

    const blogOptions = useBlogOptions();

    const currentPage = ref(1);

    const articlePerPage = computed(
      () => blogOptions.value.articlePerPage || 10
    );

    const currentArticles = computed(() =>
      props.items.slice(
        (currentPage.value - 1) * articlePerPage.value,
        currentPage.value * articlePerPage.value
      )
    );

    const updatePage = (page: number): void => {
      currentPage.value = page;

      const query = { ...route.query };

      if (query["page"] === page.toString() || (page === 1 && !query["page"]))
        return;
      if (page === 1) delete query["page"];
      else query["page"] = page.toString();

      void router.push({ path: route.path, query });
    };

    watch(currentPage, () => {
      // list top border distance
      const distance =
        document.querySelector("#article-list")!.getBoundingClientRect().top +
        window.scrollY;

      setTimeout(() => {
        window.scrollTo(0, distance);
      }, 100);
    });

    onMounted(() => {
      const { page } = route.query;

      updatePage(page ? Number(page) : 1);

      if (SUPPORT_PAGEVIEW)
        void import("vuepress-plugin-comment2/client/pageview.js").then(
          ({ updatePageview }) => {
            updatePageview();
          }
        );
    });

    return (): VNode =>
      h(
        "div",
        { id: "article-list", class: "article-wrapper" },
        currentArticles.value.length
          ? [
              ...currentArticles.value.map(({ info, path }, index) =>
                h(DropTransition, { appear: true, delay: index * 0.04 }, () =>
                  h(ArticleItem, { key: path, info, path })
                )
              ),
              h(Pagination, {
                currentPage: currentPage.value,
                perPage: articlePerPage.value,
                total: props.items.length,
                onUpdateCurrentPage: updatePage,
              }),
            ]
          : h(EmptyIcon)
      );
  },
});

import { ref } from "vue";
import { Paginated } from "../lib/bloxadmin";

export default <Type>() => {
  const paginated = ref<Paginated<Type> | null>(null);
  const loading = ref<boolean>(false);
  const limit = ref<number>(5);
  const skip = ref<number>(0);

  return { paginated, loading, limit, skip };
};

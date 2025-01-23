import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useOrderStore = defineStore('cart', () => {
  const selectedItems = ref([]);

  const setSelectedItems = (items) => {
    selectedItems.value = items;
  };

  const clearSelectedItems = () => {
    selectedItems.value = [];
  }

  return {
    selectedItems,
    setSelectedItems,
    clearSelectedItems
  };
});

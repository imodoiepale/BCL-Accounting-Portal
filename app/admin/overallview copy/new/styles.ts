// styles.ts
import { TableStyles } from './types';

export const tableStyles: TableStyles = {
    header: {
        section: `
            px-6 
            py-3 
            text-center 
            font-bold 
            border-b-4 
            sticky 
            top-0 
            z-50 
            transition-colors 
            duration-200
        `,
        category: `
            px-6 
            py-2 
            text-center 
            font-semibold 
            border-b-2 
            sticky 
            top-12 
            z-40 
            transition-colors 
            duration-200
        `,
        subcategory: `
            px-4 
            py-2 
            text-center 
            font-medium 
            border-b 
            sticky 
            top-24 
            z-30 
            transition-colors 
            duration-200 
            cursor-pointer 
            hover:bg-gray-50
        `
    },
    cell: {
        base: `
            px-4 
            py-2 
            text-sm 
            text-center 
            whitespace-nowrap 
            overflow-hidden 
            text-ellipsis 
            max-w-xs
            h-10
            transition-colors 
            duration-200
        `,
        sticky: `
            sticky 
            left-0 
            z-20 
            bg-white 
            shadow-sm
        `
    },
    row: {
        base: `
            transition-colors 
            duration-200
            h-10
        `,
        alternate: 'bg-gray-50',
        hover: 'hover:bg-blue-50'
    }
};

export const dialogStyles = {
    overlay: `
        fixed 
        inset-0 
        bg-black 
        bg-opacity-50 
        backdrop-blur-sm 
        transition-opacity
    `,
    content: `
        fixed 
        top-1/2 
        left-1/2 
        transform 
        -translate-x-1/2 
        -translate-y-1/2 
        bg-white 
        rounded-lg 
        shadow-xl 
        w-full 
        max-w-4xl 
        max-h-[90vh] 
        overflow-y-auto
        p-6
    `,
    header: `
        flex 
        justify-between 
        items-center 
        mb-4 
        pb-4 
        border-b
    `,
    title: `
        text-lg 
        font-semibold 
        text-gray-900
    `,
    body: `
        space-y-6
    `,
    footer: `
        flex 
        justify-end 
        space-x-2 
        mt-6 
        pt-4 
        border-t
    `
};

export const buttonStyles = {
    base: `
        inline-flex 
        items-center 
        justify-center 
        rounded-md 
        text-sm 
        font-medium 
        transition-colors 
        focus-visible:outline-none 
        focus-visible:ring-2 
        focus-visible:ring-offset-2 
        disabled:pointer-events-none 
        disabled:opacity-50
    `,
    primary: `
        bg-blue-600 
        text-white 
        hover:bg-blue-700 
        focus-visible:ring-blue-500
    `,
    secondary: `
        bg-white 
        text-gray-900 
        border 
        border-gray-200 
        hover:bg-gray-100 
        focus-visible:ring-gray-500
    `,
    danger: `
        bg-red-600 
        text-white 
        hover:bg-red-700 
        focus-visible:ring-red-500
    `
};

export const inputStyles = `
    flex 
    h-10 
    w-full 
    rounded-md 
    border 
    border-gray-200 
    bg-white 
    px-3 
    py-2 
    text-sm 
    transition-colors 
    file:border-0 
    file:bg-transparent 
    file:text-sm 
    file:font-medium 
    placeholder:text-gray-500 
    focus-visible:outline-none 
    focus-visible:ring-2 
    focus-visible:ring-blue-500 
    disabled:cursor-not-allowed 
    disabled:opacity-50
`;

export const selectStyles = {
    trigger: `
        inline-flex 
        h-10 
        w-full 
        items-center 
        justify-between 
        rounded-md 
        border 
        border-gray-200 
        bg-white 
        px-3 
        py-2 
        text-sm 
        placeholder:text-gray-500 
        focus:outline-none 
        focus:ring-2 
        focus:ring-blue-500 
        disabled:cursor-not-allowed 
        disabled:opacity-50
    `,
    content: `
        overflow-hidden 
        rounded-md 
        border 
        bg-white 
        shadow-md
    `,
    item: `
        relative 
        flex 
        cursor-default 
        select-none 
        items-center 
        rounded-sm 
        py-1.5 
        px-2 
        text-sm 
        outline-none 
        focus:bg-blue-100 
        data-[disabled]:pointer-events-none 
        data-[disabled]:opacity-50
    `
};
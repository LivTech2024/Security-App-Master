import { closeModal, openContextModal } from '@mantine/modals'
import { CSSProperties } from 'react'
import { toast } from 'react-toastify'

interface SnackBarProps {
  message: React.ReactNode
  type: 'info' | 'error' | 'success'
  style?: CSSProperties | undefined
}

export const showSnackbar = ({ message, type }: SnackBarProps) => {
  if (type === 'success') {
    toast.success(message)
  } else if (type === 'error') {
    toast.error(message)
  } else {
    toast.info(message)
  }
}
interface showModalLoaderProps {
  title?: string
  description?: string
}
export const showModalLoader = ({
  title,
  description,
}: showModalLoaderProps) => {
  openContextModal({
    modal: 'loader',
    withCloseButton: false,
    closeOnClickOutside: false,
    centered: true,
    //color: constColors.primaryVariantDark,
    zIndex: 500,
    // styles: {
    //   body: {
    //     backgroundColor:
    //       theme === 'dark'
    //         ? constColors.primaryVariantDark
    //         : constColors.surfaceLight
    //   }
    // },
    modalId: 'loader',
    size: 'sm',
    innerProps: { title: title, description: description },
  })
}

export const closeModalLoader = () => {
  closeModal('loader')
}

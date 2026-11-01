import styles from './styles.module.scss'
import Link from 'next/link'
import { Card } from '@/components/card'

// Card "Minha tutoria" (print 1): só o atalho para a página Tutoria, onde fica a lista de tutorados
export function CardTutoria(){
    return (
        <Card titulo="Minha tutoria">
            <Link href="/tutor/tutoria" className={styles.atalho}>
                Ver seus tutorados
            </Link>
        </Card>
    )
}

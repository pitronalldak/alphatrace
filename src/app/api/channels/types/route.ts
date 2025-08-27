import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {ChannelType} from '@/app/admin/page';

export async function GET(request: Request) {

	const channelTypes = await prisma.$queryRawUnsafe<ChannelType[]>(
		`SELECT unnest(enum_range(NULL::public.channel_type))::text AS value;`
	)

    return NextResponse.json({ channelTypes })
} 